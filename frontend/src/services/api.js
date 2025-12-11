import axios from 'axios'

// const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
const API_URL = (window.location.hostname === "localhost") ? "http://localhost:3001/api" : "https://hrsjlinhadotempo-backend.onrender.com/api" 

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Interceptor para adicionar token no header Authorization
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hrs_token')
  if (token) {
    try {
      const tokenObj = JSON.parse(token)
      config.headers.Authorization = `Bearer ${encodeURIComponent(JSON.stringify(tokenObj))}`
    } catch (e) {
      console.warn('Erro ao fazer parse do token do localStorage')
    }
  }
  return config
}, (error) => {
  return Promise.reject(error)
})

// Verificar se está autenticado no backend
export const checkAuthStatus = async () => {
  try {
    const token = localStorage.getItem('hrs_token')
    
    const params = token ? { token } : {}
    
    const response = await api.get('/auth/status', { params })
    return response.data.authenticated === true
  } catch (error) {
    return false
  }
}

// Função para ler dados da planilha com polling contínuo até sucesso
export const getSheetData = async (sheetName = 'Ações', range = 'A:Z', maxDurationMs = 30000) => {
  const startTime = Date.now();
  let attempt = 0;
  const initialDelayMs = 100; // Começa com 100ms
  const maxDelayMs = 2000;    // Máximo de 2s entre tentativas
  
  while (Date.now() - startTime < maxDurationMs) {
    attempt++;
    const elapsedMs = Date.now() - startTime;
    const delayFromLastAttempt = initialDelayMs * Math.pow(1.5, Math.min(attempt - 1, 5)); // Backoff exponencial
    const delayMs = Math.min(delayFromLastAttempt, maxDelayMs);
    
    try {
      const params = { sheetName }
      if (range) params.range = range
      
      console.log(`📊 [Tentativa ${attempt}] Buscando dados da planilha (${elapsedMs}ms decorridos)...`);
      const response = await api.get('/sheets/read', { params })

      if (response.data && response.data.success) {
        console.log(`✅ [Tentativa ${attempt}] SUCESSO! Resposta da planilha:`, response.data);
        return response.data;
      } else {
        console.warn(`⚠️ [Tentativa ${attempt}] Resposta sem sucesso:`, response.data);
      }
    } catch (error) {
      console.warn(`⚠️ [Tentativa ${attempt}] Erro ao ler planilha (${error.code || error.message})`);
    }
    
    // Calcular próximo delay
    const nextDelay = Math.min(delayMs, maxDurationMs - (Date.now() - startTime));
    
    if (nextDelay <= 0) {
      console.error(`❌ Tempo máximo de ${maxDurationMs}ms excedido. Parando polling.`);
      throw new Error(`Falha ao carregar dados após ${maxDurationMs}ms`);
    }
    
    console.log(`⏳ Aguardando ${Math.round(nextDelay)}ms antes de tentar novamente...`);
    await new Promise(resolve => setTimeout(resolve, nextDelay));
  }
  
  throw new Error(`Falha ao carregar dados. Tempo máximo de ${maxDurationMs}ms excedido.`);
}

// Função para adicionar dados na planilha
export const appendSheetData = async (values, sheetName = 'Ações') => {
  try {
    const response = await api.post('/sheets/append', {
      sheetName,
      values
    })
    return response.data
  } catch (error) {
    console.error('Erro ao adicionar dados na planilha:', error.message)
    throw error
  }
}

export default api
