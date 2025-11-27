import { useState, useEffect } from 'react'
import api, { getSheetData, checkAuthStatus } from './services/api'
import './App.css'

function App() {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sheetData, setSheetData] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    fetchMessage()
    verifyAuthentication()
    
    // Verificar se há parâmetros de autenticação na URL
    const params = new URLSearchParams(window.location.search)
    if (params.has('authenticated') && params.get('authenticated') === 'true') {
      setIsAuthenticated(true)
      // Limpar a URL
      window.history.replaceState({}, document.title, window.location.pathname)
    } else if (params.has('error')) {
      console.error('❌ Erro na autenticação:', params.get('error'))
      alert('Erro na autenticação: ' + params.get('error'))
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  const verifyAuthentication = async () => {
    try {
      const isAuth = await checkAuthStatus()
      setIsAuthenticated(isAuth)
    } catch (err) {
      setIsAuthenticated(false)
    } finally {
      setCheckingAuth(false)
    }
  }

  const fetchMessage = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await api.get('/hello')
      setMessage(response.data.message)
    } catch (err) {
      setError('Erro ao conectar com o backend: ' + err.message)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleAuthenticate = async () => {
    try {
      setAuthLoading(true)
      const response = await api.get('/auth/url')
      console.log('🔗 URL de autenticação:', response.data.authUrl)
      window.location.href = response.data.authUrl
    } catch (err) {
      console.error('❌ Erro ao obter URL de autenticação:', err)
      alert('Erro ao obter URL de autenticação')
      setAuthLoading(false)
    }
  }

  const fetchSheetData = async () => {
    try {
      console.log('📊 Iniciando leitura da planilha...')
      const data = await getSheetData('Projetos')
      
      console.log('✅ Dados da planilha recebidos:')
      console.table(data)
      console.log('Total de linhas:', data.rowCount)
      console.log('Headers:', data.headers)
      console.log('Dados completos:', data.data)
      
      setSheetData(data)
    } catch (err) {
      console.error('❌ Erro ao ler planilha:', err)
      alert('Erro ao ler planilha. Verifique se está autenticado.')
    }
  }

  return (
    <div className="container">
      <header>
        <h1>HRS Linha do Tempo</h1>
        <p>Comunicação Frontend ↔ Backend</p>
      </header>

      <main>
        {checkingAuth && (
          <section className="card">
            <p className="loading">⏳ Verificando autenticação...</p>
          </section>
        )}

        {!checkingAuth && (
          <>
            <section className="card">
              <h2>Status da Conexão</h2>
              
              {loading && <p className="loading">Carregando...</p>}
              {error && <p className="error">{error}</p>}
              {message && <p className="success">✓ {message}</p>}

              <button onClick={fetchMessage} disabled={loading}>
                {loading ? 'Conectando...' : 'Testar Conexão'}
              </button>
            </section>

            <section className="card">
              <h2>🔐 Autenticação Google Sheets</h2>
              {isAuthenticated ? (
                <p className="success">✅ Autenticado com sucesso!</p>
              ) : (
                <>
                  <p style={{ marginBottom: '1rem' }}>
                    Clique no botão abaixo para autorizar o acesso à sua planilha:
                  </p>
                  <button 
                    onClick={handleAuthenticate} 
                    disabled={authLoading}
                    style={{ backgroundColor: '#4285F4' }}
                  >
                    {authLoading ? '⏳ Redirecionando...' : '🔑 Autenticar com Google'}
                  </button>
                </>
              )}
            </section>

            <section className="card">
              <h2>📊 Leitura de Planilha</h2>
              <button onClick={fetchSheetData} disabled={!isAuthenticated}>
                📊 Ler Dados da Planilha
              </button>
              
              {!isAuthenticated && (
                <p style={{ marginTop: '1rem', color: '#f59e0b', fontSize: '0.9rem' }}>
                  ℹ️ Autentique-se primeiro para usar esta função
                </p>
              )}
              
              {sheetData && (
                <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
                  <p><strong>Status:</strong> {sheetData.message}</p>
                  <p><strong>Total de linhas:</strong> {sheetData.rowCount}</p>
                  <p style={{ fontSize: '0.9rem', color: '#666' }}>
                    💡 Abra o console do navegador (F12) para ver os dados completos!
                  </p>
                </div>
              )}
            </section>

            <section className="info">
              <h3>Arquitetura do Projeto:</h3>
              <ul>
                <li>✓ Backend Express rodando na porta 3001</li>
                <li>✓ Frontend React rodando na porta 3000</li>
                <li>✓ API REST para comunicação</li>
                <li>✓ CORS configurado</li>
                <li>✓ Integração com Google Sheets</li>
                <li>✓ Autenticação OAuth2</li>
              </ul>
            </section>
          </>
        )}
      </main>
    </div>
  )
}

export default App
