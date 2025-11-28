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
      console.log('✅ Token carregado do arquivo');
      return auth;
    }
    
    console.log('⚠️ Token não encontrado, será necessário autenticar');
    // Se não houver token, retornar auth sem token (vai usar refresh token ou exigir autenticação)
    return auth;
  } catch (error) {
    console.error('⚠️ Erro ao carregar token:', error.message);
    // Se houver erro ao ler o token, continuar sem ele
    return auth;
  }
}

/**
 * Salva o token para uso futuro
 */
function saveToken(token) {
  try {
    // Garantir que o diretório existe
    const dir = path.dirname(TOKEN_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(TOKEN_PATH, JSON.stringify(token, null, 2));
    console.log('✅ Token salvo em:', TOKEN_PATH);
  } catch (error) {
    console.error('❌ Erro ao salvar token:', error.message);
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

    console.log('📋 Redirect URIs disponíveis:', redirect_uris);

    // Determinar o redirect_uri baseado no host da requisição
    const host = req.get('host'); 
    let selectedRedirectUri = redirect_uris[0]; // Default: primeiro da lista

    // Se estamos em localhost, usar o redirect_uri de localhost
    if (host && host.includes('localhost')) {
      selectedRedirectUri = redirect_uris.find(uri => uri.includes('localhost')) || redirect_uris[0];
      console.log('✅ Host é localhost, usando:', selectedRedirectUri);
    } 
    // Se estamos em Render, usar o redirect_uri de Render
    else if (host && host.includes('render')) {
      selectedRedirectUri = redirect_uris.find(uri => uri.includes('render')) || redirect_uris[1];
      console.log('✅ Host é Render, usando:', selectedRedirectUri);
    }

    console.log('📍 Host detectado:', host);
    console.log('📍 Redirect URI selecionado:', selectedRedirectUri);

    const auth = new google.auth.OAuth2(
      client_id,
      client_secret,
      selectedRedirectUri
    );

    const authUrl = auth.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/spreadsheets'],
      prompt: 'consent' // Força a tela de consentimento para garantir refresh_token
    });

    console.log('🔗 URL de autenticação gerada');
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

    console.log('🔐 Callback recebido');
    console.log('  Code:', code ? code.substring(0, 20) + '...' : 'NONE');

    if (!code) {
      return res.status(400).json({ error: 'Código de autenticação não fornecido' });
    }

    const credentialsData = fs.readFileSync(CREDENTIALS_PATH, 'utf-8');
    const credentials = JSON.parse(credentialsData);
    const { client_id, client_secret, redirect_uris } = credentials.installed;

    console.log('📋 Redirect URIs disponíveis:', redirect_uris);

    // Determinar o redirect_uri baseado no host da requisição (deve ser o EXATO que foi usado para gerar a URL)
    const host = req.get('host'); // localhost:3001 ou hrsjlinhadotempo-backend.onrender.com
    let selectedRedirectUri = redirect_uris[0]; // Default: primeiro da lista

    // Se estamos em localhost, usar o redirect_uri de localhost
    if (host && host.includes('localhost')) {
      selectedRedirectUri = redirect_uris.find(uri => uri.includes('localhost')) || redirect_uris[0];
      console.log('✅ Host é localhost, usando:', selectedRedirectUri);
    } 
    // Se estamos em Render, usar o redirect_uri de Render
    else if (host && host.includes('render')) {
      selectedRedirectUri = redirect_uris.find(uri => uri.includes('render')) || redirect_uris[1];
      console.log('✅ Host é Render, usando:', selectedRedirectUri);
    }

    console.log('📍 Host detectado:', host);
    console.log('📍 Redirect URI selecionado:', selectedRedirectUri);

    const auth = new google.auth.OAuth2(
      client_id,
      client_secret,
      selectedRedirectUri
    );

    console.log('🔄 Obtendo token com código de autenticação...');
    const { tokens } = await auth.getToken(code);
    
    console.log('📋 Token obtido:', {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      expiresIn: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : 'N/A'
    });
    
    auth.setCredentials(tokens);

    // Salvar token para reutilização no servidor (backup)
    saveToken(tokens);

    // Redirecionar de volta ao frontend com token no query string
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const tokenParam = encodeURIComponent(JSON.stringify(tokens));
    console.log('🔀 Redirecionando para:', frontendUrl);
    res.redirect(`${frontendUrl}?authenticated=true&token=${tokenParam}`);
  } catch (error) {
    console.error('❌ Erro ao obter token:', error.message);
    console.error('   Error details:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}?error=${encodeURIComponent(error.message)}`);
  }
}

/**
 * Verifica o status da autenticação
 * Pode receber o token via query string (localStorage do frontend)
 */
export function checkAuthStatus(req, res) {
  try {
    // Tentar obter token do query string (vindo do localStorage do frontend)
    const tokenParam = req.query.token;
    
    let token = null;

    if (tokenParam) {
      try {
        token = JSON.parse(decodeURIComponent(tokenParam));
        console.log('✅ Token recebido do frontend (localStorage)');
      } catch (e) {
        console.log('⚠️ Token inválido do frontend');
      }
    }

    // Se não houver token no query string, tentar carregar do arquivo (backup)
    if (!token && fs.existsSync(TOKEN_PATH)) {
      try {
        const tokenData = fs.readFileSync(TOKEN_PATH, 'utf-8');
        token = JSON.parse(tokenData);
        console.log('✅ Token carregado do arquivo (backup)');
      } catch (e) {
        console.log('⚠️ Erro ao ler token do arquivo');
      }
    }

    if (!token) {
      return res.json({
        authenticated: false,
        message: 'Nenhum token encontrado'
      });
    }

    // Verificar se o token expirou
    const isExpired = token.expiry_date && token.expiry_date <= Date.now();

    res.json({
      authenticated: !isExpired && !!token.access_token,
      message: isExpired ? 'Token expirado' : 'Token válido',
      tokenExpiresAt: token.expiry_date ? new Date(token.expiry_date).toISOString() : 'N/A'
    });
  } catch (error) {
    console.error('Erro ao verificar status de autenticação:', error.message);
    res.json({
      authenticated: false,
      message: 'Erro ao verificar autenticação',
      error: error.message
    });
  }
}

/**
 * Lê dados de uma planilha do Google Sheets
 * Pode usar token do header Authorization (frontend localStorage)
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

    // Tentar obter token do header Authorization (Bearer token do frontend)
    let auth = null;
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const tokenParam = authHeader.substring(7); // Remove "Bearer "
        const token = JSON.parse(decodeURIComponent(tokenParam));
        
        const credentialsData = fs.readFileSync(CREDENTIALS_PATH, 'utf-8');
        const credentials = JSON.parse(credentialsData);
        const { client_id, client_secret, redirect_uris } = credentials.installed;

        auth = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
        auth.setCredentials(token);
        
        console.log('✅ Usando token do header Authorization (frontend localStorage)');
      } catch (e) {
        console.log('⚠️ Erro ao usar token do header, tentando arquivo backup');
        auth = await authenticateGoogle();
      }
    } else {
      // Se não houver token no header, usar arquivo (backup)
      auth = await authenticateGoogle();
    }
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

    // Organizar dados em categorias
    const categorizedData = organizeDataByCategories(data);

    res.json({
      success: true,
      message: 'Dados lidos com sucesso',
      rowCount: data.length,
      headers: headers,
      categories: categorizedData
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
 * Organiza dados em categorias baseado em palavras-chave
 * Categorias: 'Aprendizagem e Crescimento', 'Processos', 'Cliente e Mercado', 'Resultado'
 */
function organizeDataByCategories(data) {
  const categories = {
    'Aprendizagem e Crescimento': [],
    'Processos': [],
    'Cliente e Mercado': [],
    'Resultado': []
  };

  let currentCategory = 'Aprendizagem e Crescimento';

  for (const row of data) {
    // Juntar todos os valores da linha para buscar keywords
    const rowText = Object.values(row).join(' ').toUpperCase();

    // Verificar se a linha contém keywords de categoria
    if (rowText.includes('PROCESSOS')) {
      currentCategory = 'Processos';
      continue; // Pular a linha que contém a keyword
    } else if (rowText.includes('CLIENTE E MERCADO')) {
      currentCategory = 'Cliente e Mercado';
      continue; // Pular a linha que contém a keyword
    } else if (rowText.includes('RESULTADO')) {
      currentCategory = 'Resultado';
      continue; // Pular a linha que contém a keyword
    } else if (rowText.includes('APRENDIZAGEM E CRESCIMENTO')) {
      // Para essa linha, remover apenas a célula com 'APRENDIZAGEM E CRESCIMENTO'
      // e manter o resto
      // Não usar continue aqui, vamos processar a linha
    }

    // Limpar a linha removendo células vazias e o texto 'APRENDIZAGEM E CRESCIMENTO'
    const cleanedRow = {};
    let hasContent = false;
    let hasProjeto = false;

    for (const [key, value] of Object.entries(row)) {
      let cleanedValue = value ? value.toString().trim() : '';
      
      // Remover apenas o texto 'APRENDIZAGEM E CRESCIMENTO' da célula
      if (cleanedValue.toUpperCase() === 'APRENDIZAGEM E CRESCIMENTO') {
        cleanedValue = '';
      }
      
      if (cleanedValue !== '') {
        cleanedRow[key] = cleanedValue;
        hasContent = true;
        if (key === 'PROJETO') {
          hasProjeto = true;
        }
      }
    }

    // Adicionar apenas se houver conteúdo E a chave 'PROJETO' existir
    if (hasContent && hasProjeto) {
      categories[currentCategory].push(cleanedRow);
    }
  }

  return categories;
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
