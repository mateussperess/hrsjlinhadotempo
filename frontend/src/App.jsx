import { useState, useEffect } from 'react'
import { checkAuthStatus } from './services/api'
import LoginPage from './pages/Login'
import DashboardPage from './pages/DashboardPage'
import './App.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    initializeAuth()
  }, [])

  const initializeAuth = async () => {
    // Extrair token da URL se presente (vindo do callback do backend)
    const params = new URLSearchParams(window.location.search)
    const tokenParam = params.get('token')
    
    if (tokenParam) {
      try {
        const token = JSON.parse(decodeURIComponent(tokenParam))
        localStorage.setItem('hrs_token', JSON.stringify(token))
        console.log('✅ Token salvo no localStorage')
        setIsAuthenticated(true)
        
        // Limpar URL para não expor o token
        window.history.replaceState({}, document.title, window.location.pathname)
        setCheckingAuth(false)
        return
      } catch (e) {
        console.error('❌ Erro ao processar token da URL:', e)
      }
    }
    
    // Se houver erro na URL, mostrar alerta
    if (params.has('error')) {
      console.error('❌ Erro na autenticação:', params.get('error'))
      alert('Erro na autenticação: ' + params.get('error'))
      window.history.replaceState({}, document.title, window.location.pathname)
    }
    
    // Verificar autenticação usando localStorage
    try {
      const isAuth = await checkAuthStatus()
      setIsAuthenticated(isAuth)
    } catch (err) {
      setIsAuthenticated(false)
    } finally {
      setCheckingAuth(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('hrs_token')
    setIsAuthenticated(false)
    console.log('✅ Usuário desconectado')
  }

  // Loading state
  if (checkingAuth) {
    return (
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
    )
  }

  // Render pages based on authentication state
  return (
    <>
      {!isAuthenticated ? (
        <LoginPage />
      ) : (
        <DashboardPage onLogout={handleLogout} />
      )}
    </>
  )
}

export default App
