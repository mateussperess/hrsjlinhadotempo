import { useState, useEffect } from 'react'
import api from './services/api'
import './App.css'

function App() {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchMessage()
  }, [])

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

  return (
    <div className="container">
      <header>
        <h1>HRS Linha do Tempo</h1>
        <p>Comunicação Frontend ↔ Backend</p>
      </header>

      <main>
        <section className="card">
          <h2>Status da Conexão</h2>
          
          {loading && <p className="loading">Carregando...</p>}
          {error && <p className="error">{error}</p>}
          {message && <p className="success">✓ {message}</p>}

          <button onClick={fetchMessage} disabled={loading}>
            {loading ? 'Conectando...' : 'Testar Conexão'}
          </button>
        </section>

        <section className="info">
          <h3>Arquitetura do Projeto:</h3>
          <ul>
            <li>✓ Backend Express rodando na porta 3001</li>
            <li>✓ Frontend React rodando na porta 3000</li>
            <li>✓ API REST para comunicação</li>
            <li>✓ CORS configurado</li>
          </ul>
        </section>
      </main>
    </div>
  )
}

export default App
