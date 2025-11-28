import { useState, useEffect } from 'react'
import api, { getSheetData, checkAuthStatus } from './services/api'
import Timeline from './components/Timeline'
import Login from './pages/Login'
import './App.css'

function App() {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sheetData, setSheetData] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [dataLoading, setDataLoading] = useState(false)

  useEffect(() => {
    // Extrair token da URL se presente (vindo do callback do backend)
    const params = new URLSearchParams(window.location.search)
    const tokenParam = params.get('token')
    
    if (tokenParam) {
      try {
        const token = JSON.parse(decodeURIComponent(tokenParam))
        localStorage.setItem('hrs_token', JSON.stringify(token))
        console.log('✅ Token salvo no localStorage')
        setIsAuthenticated(true)
        
        window.history.replaceState({}, document.title, window.location.pathname)
      } catch (e) {
        console.error('❌ Erro ao processar token da URL:', e)
      }
    }
    
    if (params.has('authenticated') && params.get('authenticated') === 'true') {
      setIsAuthenticated(true)
      window.history.replaceState({}, document.title, window.location.pathname)
    } else if (params.has('error')) {
      console.error('❌ Erro na autenticação:', params.get('error'))
      alert('Erro na autenticação: ' + params.get('error'))
      window.history.replaceState({}, document.title, window.location.pathname)
    }
    
    // Verificar autenticação
    verifyAuthentication()
  }, [])

  const verifyAuthentication = async () => {
    try {
      const isAuth = await checkAuthStatus()
      setIsAuthenticated(isAuth)
      if (isAuth) {
        await autoLoadData()
      }
    } catch (err) {
      setIsAuthenticated(false)
    } finally {
      setCheckingAuth(false)
    }
  }

  const autoLoadData = async () => {
    try {
      setDataLoading(true)
      const data = await getSheetData('Projetos')
      setSheetData(data)
    } catch (err) {
      console.warn('Não foi possível carregar dados automaticamente')
    } finally {
      setDataLoading(false)
    }
  }

  const fetchSheetData = async () => {
    try {
      setDataLoading(true)
      const data = await getSheetData('Projetos')
      setSheetData(data)
    } catch (err) {
      console.error('❌ Erro ao ler planilha:', err)
      alert('Erro ao ler planilha. Verifique se está autenticado.')
    } finally {
      setDataLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('hrs_token')
    setIsAuthenticated(false)
    setSheetData(null)
    console.log('✅ Usuário desconectado')
  }

  return (
    <>
      {/* Show Login Page if not authenticated */}
      {!checkingAuth && !isAuthenticated && (
        <Login />
      )}

      {/* Show App if authenticated */}
      {!checkingAuth && isAuthenticated && (
        <div className="app-container">
          {/* Header Premium */}
          <header className="premium-header">
            <div className="header-content">
              <div className="header-left">
                <h1 className="main-title">📅 HRSJ Linha do Tempo</h1>
                <p className="header-subtitle">Visualize e gerencie seus projetos estratégicos</p>
              </div>
              <div className="header-right">
                <div className={`auth-badge authenticated`}>
                  <span className="badge-dot"></span>
                  <span className="badge-text">✓ Autenticado</span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="btn btn-logout"
                  title="Desconectar"
                >
                  Sair
                </button>
              </div>
            </div>
          </header>

          <main className="main-content">
            {/* Action Bar */}
            <section className="action-bar">
              <button 
                onClick={fetchSheetData} 
                disabled={dataLoading}
                className="btn btn-primary"
              >
                {dataLoading ? 'Carregando...' : 'Recarregar Dados'}
              </button>
            </section>

            {/* Timeline */}
            {dataLoading && !sheetData && (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p className="loading-text">Carregando dados...</p>
              </div>
            )}

            {sheetData && sheetData.categories && (
              <Timeline categories={sheetData.categories} />
            )}

            {!sheetData && !dataLoading && (
              <section className="empty-state">
                <div className="empty-icon">📋</div>
                <h3>Nenhum dado carregado</h3>
                <p>Clique em "Recarregar Dados" para visualizar a linha do tempo de projetos</p>
              </section>
            )}
          </main>

          {/* Footer */}
          <footer className="app-footer">
            <p>HRSJ - Linha do Tempo de Projetos | Equipe de Desenvolvimento HRSJ </p>
          </footer>
        </div>
      )}

      {/* Loading State */}
      {checkingAuth && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #7e8ba3 100%)'
        }}>
          <div className="loading-container" style={{ background: 'white', borderRadius: '16px', padding: '40px' }}>
            <div className="loading-spinner"></div>
            <p className="loading-text">Verificando autenticação...</p>
          </div>
        </div>
      )}
    </>
  )
}

export default App
