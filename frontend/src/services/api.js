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

// Função para ler dados da planilha
export const getSheetData = async (sheetName = 'Ações', range = 'A:Z') => {
  try {
    const params = { sheetName }
    if (range) params.range = range
    
    const response = await api.get('/sheets/read', { params })
    return response.data
  } catch (error) {
    console.error('Erro ao ler planilha:', error.message)
    throw error
  }
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
