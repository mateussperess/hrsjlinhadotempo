import { useState } from 'react'
import api from '../services/api'
import '../styles/Login.css'

function Login({ onAuthSuccess }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGoogleAuth = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await api.get('/auth/url')
      window.location.href = response.data.authUrl
    } catch (err) {
      setError('Erro ao obter URL de autenticação. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      {/* Background Elements */}
      <div className="bg-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>

      <div className="login-content">
        {/* Left Side - Branding */}
        <div className="login-left">
          <div className="brand-section">
            <div className="brand-icon">📅</div>
            <h1 className="brand-title">HRSJ Linha do Tempo</h1>
            <p className="brand-subtitle">Gestão Estratégica de Projetos</p>
          </div>

          <div className="features">
            <div className="feature">
              <div className="feature-icon">📊</div>
              <div className="feature-text">
                <h3>Visualize seus Projetos</h3>
                <p>Acompanhe todos os seus projetos em uma linha do tempo intuitiva</p>
              </div>
            </div>

            <div className="feature">
              <div className="feature-icon">🏷️</div>
              <div className="feature-text">
                <h3>Organize por Categorias</h3>
                <p>Categorize seus projetos e filtre com facilidade</p>
              </div>
            </div>

            <div className="feature">
              <div className="feature-icon">📱</div>
              <div className="feature-text">
                <h3>Acesso Sincronizado</h3>
                <p>Seus dados sempre em sincronia com o Google Sheets</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="login-right">
          <div className="login-card">
            <div className="login-header">
              <h2>Bem-vindo!</h2>
              <p>Faça login para acessar a plataforma</p>
            </div>

            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleGoogleAuth}
              disabled={loading}
              className="btn-google"
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Redirecionando...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continuar com Google
                </>
              )}
            </button>

            <div className="divider">
              <span>ou</span>
            </div>

            <p className="login-info">
              🔐 Você será redirecionado para autorizar o acesso ao Google Sheets
            </p>

            <div className="security-badge">
              <span className="lock-icon">🔒</span>
              <span>Conexão segura com SSL</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
