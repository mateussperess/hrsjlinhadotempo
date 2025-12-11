import { useState, useEffect } from 'react'
import { getSheetData } from '../services/api'
import Timeline from '../components/Timeline'
import '../styles/Dashboard.css'

function DashboardPage({ onLogout }) {
  const [sheetData, setSheetData] = useState(null)
  const [dataLoading, setDataLoading] = useState(false)
  const [autoLoaded, setAutoLoaded] = useState(false)

  useEffect(() => {
    // Carregar dados automaticamente apenas uma vez
    if (!autoLoaded) {
      autoLoadData()
      setAutoLoaded(true)
    }
  }, [autoLoaded])

  const autoLoadData = async () => {
    try {
      setDataLoading(true)
      console.log('📊 Carregando dados automaticamente (com polling até 30s)...')
      const data = await getSheetData('Projetos', '', 30000) // 30 segundos de timeout
      console.log('✅ Dados carregados com sucesso:', data)
      setSheetData(data)
    } catch (err) {
      console.error('❌ Erro ao carregar dados:', err.message)
      // Mostrar erro ao usuário apenas se falhar completamente
      alert(`Erro ao carregar dados: ${err.message}. Clique em "Recarregar Dados" para tentar novamente.`)
    } finally {
      setDataLoading(false)
    }
  }

  const fetchSheetData = async () => {
    try {
      setDataLoading(true)
      console.log('📊 Recarregando dados manualmente (com polling até 30s)...')
      const data = await getSheetData('Projetos', '', 30000) // 30 segundos de timeout
      console.log('✅ Dados recarregados com sucesso:', data)
      setSheetData(data)
    } catch (err) {
      console.error('❌ Erro ao ler planilha:', err.message)
      alert(`Erro ao recarregar dados: ${err.message}. Tente novamente.`)
    } finally {
      setDataLoading(false)
    }
  }

  return (
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
              onClick={onLogout}
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
          <Timeline categories={sheetData.categories} allProjects={sheetData.allProjects} />
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
  )
}

export default DashboardPage
