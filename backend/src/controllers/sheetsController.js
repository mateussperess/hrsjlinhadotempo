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
    return auth;
  } catch (error) {
    console.error('⚠️ Erro ao carregar token:', error.message);
    return auth;
  }
}

/**
 * Salva o token para uso futuro
 */
function saveToken(token) {
  try {
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

    const host = req.get('host'); 
    let selectedRedirectUri = redirect_uris[0]; 

    if (host && host.includes('localhost')) {
      selectedRedirectUri = redirect_uris.find(uri => uri.includes('localhost')) || redirect_uris[0];
      console.log('✅ Host é localhost, usando:', selectedRedirectUri);
    } else if (host && host.includes('render')) {
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
      prompt: 'consent' 
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

    const host = req.get('host'); 
    let selectedRedirectUri = redirect_uris[0]; 

    // Se estamos em localhost, usar o redirect_uri de localhost
    if (host && host.includes('localhost')) {
      selectedRedirectUri = redirect_uris.find(uri => uri.includes('localhost')) || redirect_uris[0];
      console.log('✅ Host é localhost, usando:', selectedRedirectUri);
    } else if (host && host.includes('render')) {
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
    console.log(`📊 [getSheetData] Requisição recebida - Aba: ${sheetName}, Range: ${range || 'A:Z'}`);

    // Tentar obter token do header Authorization (Bearer token do frontend)
    let auth = null;
    let tokenSource = 'desconhecida';
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const tokenParam = authHeader.substring(7); 
        const token = JSON.parse(decodeURIComponent(tokenParam));
        
        if (!token.access_token) {
          throw new Error('Token inválido: sem access_token');
        }
        
        const credentialsData = fs.readFileSync(CREDENTIALS_PATH, 'utf-8');
        const credentials = JSON.parse(credentialsData);
        const { client_id, client_secret, redirect_uris } = credentials.installed;

        auth = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
        auth.setCredentials(token);
        
        tokenSource = 'header Authorization (localStorage do frontend)';
        console.log('✅ Token autenticado via header Authorization');
      } catch (e) {
        console.log('⚠️ Erro ao usar token do header:', e.message);
        tokenSource = 'erro no header - tentando arquivo backup';
      }
    }

    // Se não conseguiu com header, tentar arquivo backup
    if (!auth) {
      try {
        auth = await authenticateGoogle();
        tokenSource = 'arquivo token.json (backup)';
        console.log('✅ Token autenticado via arquivo backup');
      } catch (e) {
        console.error('❌ Falha ao obter autenticação:', e.message);
        return res.status(401).json({
          error: 'Não autenticado',
          message: 'Token expirado ou inválido. Faça login novamente.',
          details: e.message
        });
      }
    }

    const sheets = google.sheets({ version: 'v4', auth });

    const readRange = range ? `${sheetName}!${range}` : `${sheetName}!A:Z`;
    console.log(`📍 Lendo intervalo: ${readRange} (Token: ${tokenSource})`);

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: readRange,
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log('⚠️ Nenhuma linha encontrada na planilha');
      return res.json({
        success: true,
        message: 'Nenhum dado encontrado',
        data: []
      });
    }

    console.log(`✅ ${rows.length} linhas lidas da planilha`);

    // O header está na linha 3 (índice 2)
    const headerIndex = 2;
    
    if (rows.length <= headerIndex) {
      console.log('⚠️ Header não encontrado (não há linha 3)');
      return res.json({
        success: true,
        message: 'Header não encontrado',
        data: []
      });
    }

    const headers = rows[headerIndex];
    
    if (!headers || !headers.some(h => h && h.toString().trim() !== '')) {
      console.log('⚠️ Header vazio');
      return res.json({
        success: true,
        message: 'Nenhum header encontrado',
        data: []
      });
    }

    const data = rows.slice(headerIndex + 1).map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row && row[index] ? row[index] : '';
      });
      return obj;
    });

    console.log(`📋 ${data.length} linhas de dados processadas`);

    // Organizar dados em categorias
    const categorizedData = organizeDataByCategories(data);

    const allProjects = [];
    Object.values(categorizedData).forEach(categoryProjects => {
      allProjects.push(...categoryProjects);
    });
    
    allProjects.sort((a, b) => {
      const dateA = parseDate(a['DATA INÍCIO'] || a['DATA FIM'] || '');
      const dateB = parseDate(b['DATA INÍCIO'] || b['DATA FIM'] || '');
      return dateA - dateB;
    });

    const totalByCategory = Object.entries(categorizedData).map(([cat, items]) => `${cat}: ${items.length}`).join(', ');
    console.log(`✅ Dados categorizados - ${totalByCategory}`);

    res.json({
      success: true,
      message: 'Dados lidos com sucesso',
      rowCount: data.length,
      headers: headers,
      categories: categorizedData,
      allProjects: allProjects  
    });

  } catch (error) {
    console.error('❌ Erro ao ler planilha:', error.message);
    console.error('   Stack:', error.stack);
    res.status(500).json({
      error: 'Erro ao ler dados da planilha',
      details: error.message
    });
  }
}

/**
 * Converte data em formato brasileiro (DD/MM/YYYY) ou apenas ano para timestamp
 * Retorna 0 se não conseguir fazer parse
 */
function parseDate(dateStr) {
  if (!dateStr || dateStr.trim() === '') {
    return 0; // Data vazia fica no início
  }

  if (/^\d{4}$/.test(dateStr.trim())) {
    const year = parseInt(dateStr.trim());
    return new Date(year, 0, 1).getTime(); 
  }

  const match = dateStr.trim().match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (match) {
    const [_, day, month, year] = match;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.getTime();
  }

  return Infinity; 
}

/**
 * Organiza dados em categorias baseado em palavras-chave
 * Categorias: 'Aprendizagem e Crescimento', 'Processos', 'Cliente e Mercado', 'Resultado'
 */
function organizeDataByCategories(data) {
  const categories = {
    'Aprendizagem e Crescimento': [],
    'Processos': [],
    'Clientes e Mercado': [],
    'Resultado': []
  };

  let currentCategory = 'Aprendizagem e Crescimento';

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    
    const categoryMarker = row[''] ? row[''].toString().trim().toUpperCase() : '';
    
    if (categoryMarker) {
      if (categoryMarker.includes('APRENDIZAGEM E CRESCIMENTO')) {
        currentCategory = 'Aprendizagem e Crescimento';
      } else if (categoryMarker.includes('PROCESSOS')) {
        currentCategory = 'Processos';
      } else if (categoryMarker.includes('CLIENTES E MERCADO')) {
        currentCategory = 'Clientes e Mercado';
      } else if (categoryMarker.includes('RESULTADO')) {
        currentCategory = 'Resultado';
      }
    }

    const cleanedRow = {};
    let hasContent = false;
    let hasProjectField = false;

    for (const [key, value] of Object.entries(row)) {
      const cleanedValue = value ? value.toString().trim() : '';
      
      if (cleanedValue !== '') {
        cleanedRow[key] = cleanedValue;
        hasContent = true;
        if (key === 'PROJETOS' || key === 'PROJETOS / AÇÕES') {
          hasProjectField = true;
        }
      }
    }

    if (hasContent && hasProjectField) {
      // Adicionar a categoria ao objeto do projeto
      cleanedRow.category = currentCategory;
      categories[currentCategory].push(cleanedRow);
      const projectName = cleanedRow['PROJETO / AÇÕES'] || cleanedRow['PROJETO'];
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
