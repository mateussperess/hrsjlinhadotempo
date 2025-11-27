import axios from 'axios'

// const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
const API_URL = (window.location.hostname === "localhost") ? "http://localhost:3001/api" : "https://hrsjlinhadotempo-backend.onrender.com/" 

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Verificar se está autenticado no backend
export const checkAuthStatus = async () => {
  try {
    const response = await api.get('/auth/status')
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
