import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Caminho do arquivo de credenciais
const CREDENTIALS_PATH = path.join(__dirname, '../../credentials.json');
const TOKEN_PATH = path.join(__dirname, '../../token.json');

/**
 * Carrega ou cria um token de acesso
 */
async function loadOrCreateToken(auth) {
  try {
    if (fs.existsSync(TOKEN_PATH)) {
      const tokenData = fs.readFileSync(TOKEN_PATH, 'utf-8');
      const token = JSON.parse(tokenData);
      auth.setCredentials(token);
      return auth;
    }
    
    // Se não houver token, retornar auth sem token (vai usar refresh token ou exigir autenticação)
    return auth;
  } catch (error) {
    console.error('Erro ao carregar token:', error);
    return auth;
  }
}

/**
 * Salva o token para uso futuro
 */
function saveToken(token) {
  try {
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(token, null, 2));
    console.log('✅ Token salvo em:', TOKEN_PATH);
  } catch (error) {
    console.error('Erro ao salvar token:', error);
  }
}

/**
 * Autentica com o Google usando as credenciais
 */
async function authenticateGoogle() {
  try {
    const credentialsData = fs.readFileSync(CREDENTIALS_PATH, 'utf-8');
    const credentials = JSON.parse(credentialsData);

    const { client_id, client_secret, redirect_uris } = credentials.installed;

    const auth = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[0]
    );

    // Tentar carregar token existente
    await loadOrCreateToken(auth);

    return auth;
  } catch (error) {
    throw new Error(`Erro ao autenticar com Google: ${error.message}`);
  }
}

/**
 * Gera URL de autenticação
 */
export function getAuthUrl(req, res) {
  try {
    const credentialsData = fs.readFileSync(CREDENTIALS_PATH, 'utf-8');
    const credentials = JSON.parse(credentialsData);
    const { client_id, client_secret, redirect_uris } = credentials.installed;

    const auth = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[0]
    );

    const authUrl = auth.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    res.json({ authUrl });
  } catch (error) {
    console.error('Erro ao gerar URL de autenticação:', error);
    res.status(500).json({
      error: 'Erro ao gerar URL de autenticação',
      details: error.message
    });
  }
}

/**
 * Troca o código de autenticação por um token
 */
export async function handleAuthCallback(req, res) {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({ error: 'Código de autenticação não fornecido' });
    }

    const credentialsData = fs.readFileSync(CREDENTIALS_PATH, 'utf-8');
    const credentials = JSON.parse(credentialsData);
    const { client_id, client_secret, redirect_uris } = credentials.installed;

    const auth = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[0]
    );

    const { tokens } = await auth.getToken(code);
    auth.setCredentials(tokens);

    // Salvar token para reutilização
    saveToken(tokens);

    // Redirecionar de volta ao frontend com sucesso
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}?authenticated=true`);
  } catch (error) {
    console.error('Erro ao obter token:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}?error=${encodeURIComponent(error.message)}`);
  }
}

/**
 * Lê dados de uma planilha do Google Sheets
 * @param {string} sheetName - Nome da aba (ex: 'Projetos')
 * @param {string} range - Intervalo (ex: 'A1:D10' ou deixe vazio para ler tudo)
 */
export async function getSheetData(req, res) {
  try {
    const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
    
    if (!SPREADSHEET_ID) {
      return res.status(400).json({
        error: 'SPREADSHEET_ID não configurado nas variáveis de ambiente'
      });
    }

    const { sheetName = 'Projetos', range } = req.query;

    const auth = await authenticateGoogle();
    const sheets = google.sheets({ version: 'v4', auth });

    // Se não especificar range, ler toda a aba (A:Z cobre todas as colunas comuns)
    const readRange = range ? `${sheetName}!${range}` : `${sheetName}!A:Z`;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: readRange,
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      return res.json({
        success: true,
        message: 'Nenhum dado encontrado',
        data: []
      });
    }

    // O header está na linha 3 (índice 2)
    const headerIndex = 2;
    
    if (rows.length <= headerIndex) {
      return res.json({
        success: true,
        message: 'Header não encontrado',
        data: []
      });
    }

    const headers = rows[headerIndex];
    
    // Se não encontrar headers válidos, retornar erro
    if (!headers || !headers.some(h => h && h.toString().trim() !== '')) {
      return res.json({
        success: true,
        message: 'Nenhum header encontrado',
        data: []
      });
    }

    // Pegar apenas dados após o header (a partir da linha 4, índice 3)
    const data = rows.slice(headerIndex + 1).map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        // Pegar o valor da coluna ou vazio
        obj[header] = row && row[index] ? row[index] : '';
      });
      return obj;
    });

    res.json({
      success: true,
      message: 'Dados lidos com sucesso',
      rowCount: data.length,
      headers: headers,
      data: data
    });

  } catch (error) {
    console.error('Erro ao ler planilha:', error);
    res.status(500).json({
      error: 'Erro ao ler dados da planilha',
      details: error.message
    });
  }
}

/**
 * Escreve dados em uma planilha do Google Sheets
 */
export async function appendSheetData(req, res) {
  try {
    const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
    
    if (!SPREADSHEET_ID) {
      return res.status(400).json({
        error: 'SPREADSHEET_ID não configurado nas variáveis de ambiente'
      });
    }

    const { sheetName = 'Sheet1', values } = req.body;

    if (!values || !Array.isArray(values)) {
      return res.status(400).json({
        error: 'Campo "values" é obrigatório e deve ser um array'
      });
    }

    const auth = await authenticateGoogle();
    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A:A`,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: values
      }
    });

    res.json({
      success: true,
      message: 'Dados adicionados com sucesso',
      updatedCells: response.data.updates.updatedCells,
      updatedRange: response.data.updates.updatedRange
    });

  } catch (error) {
    console.error('Erro ao escrever na planilha:', error);
    res.status(500).json({
      error: 'Erro ao escrever dados na planilha',
      details: error.message
    });
  }
}
