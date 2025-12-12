import { useState, useMemo, useEffect, useRef } from 'react'
import '../styles/Timeline.css'

function Timeline({ categories, allProjects: backendAllProjects }) {
  const [selectedCategory, setSelectedCategory] = useState('Todos')
  const [currentMonth, setCurrentMonth] = useState('Todos')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [presentationMode, setPresentationMode] = useState(false)
  const [currentProjectIndex, setCurrentProjectIndex] = useState(0)
  const timelineRef = useRef(null)
  const presentationTimelineRef = useRef(null)

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]

  const getProjectMonthYear = (project) => {
    const date = parseDate(project['DATA INÍCIO'] || project['DATA FIM'])
    if (!date) return 'Data não informada'
    return `${monthNames[date.getMonth()]} de ${date.getFullYear()}`
  }

  // Auto-scroll do timeline em modo apresentação
  useEffect(() => {
    if (!presentationMode || !presentationTimelineRef.current) return

    const timeline = presentationTimelineRef.current
    const selectedItem = timeline.querySelector('.presentation-timeline-item.selected')
    
    if (selectedItem) {
      selectedItem.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      })
    }
  }, [currentProjectIndex, presentationMode])

  const allProjects = useMemo(() => {
    if (backendAllProjects && Array.isArray(backendAllProjects)) {
      return backendAllProjects.map((item, idx) => ({
        ...item,
        category: item.category || 'Outros'
      }))
    }
    
    if (!categories) return []
    
    let projects = []
    Object.entries(categories).forEach(([categoryName, items]) => {
      projects = projects.concat(
        items.map(item => ({
          ...item,
          category: item.category || categoryName
        }))
      )
    })
    return projects
  }, [categories, backendAllProjects])

  const parseDate = (dateString) => {
    if (!dateString) return null
    
    const trimmed = dateString.trim()
    
    if (/^\d{4}$/.test(trimmed)) {
      return new Date(parseInt(trimmed), 0, 1) 
    }
    
    // Tentar DD/MM/YYYY
    const parts = trimmed.split('/')
    if (parts.length === 3) {
      const [day, month, year] = parts.map(Number)
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        return new Date(year, month - 1, day)
      }
    }
    
    return null
  }

  // Filtrar e ordenar projetos
  const filteredProjects = useMemo(() => {
    let projects = selectedCategory === 'Todos' 
      ? allProjects 
      : allProjects.filter(project => project.category === selectedCategory)
    
    if (dateFrom || dateTo) {
      projects = projects.filter(project => {
        const projectDate = parseDate(project['DATA INÍCIO'] || project['DATA FIM'])
        if (!projectDate) return false 
        
        if (dateFrom) {
          // Input vem em formato YYYY-MM-DD
          const [year, month, day] = dateFrom.split('-').map(Number)
          const fromDate = new Date(year, month - 1, day)
          if (projectDate < fromDate) return false
        }
        
        if (dateTo) {
          // Input vem em formato YYYY-MM-DD
          const [year, month, day] = dateTo.split('-').map(Number)
          const toDate = new Date(year, month - 1, day)
          // Adicionar um dia ao "até" para incluir o dia inteiro
          toDate.setDate(toDate.getDate() + 1)
          if (projectDate > toDate) return false
        }
        
        return true
      })
    }
    
    // Ordenar por data (crescente - mais antigo primeiro)
    projects.sort((a, b) => {
      const dateA = parseDate(a['DATA INÍCIO'] || a['DATA FIM'])
      const dateB = parseDate(b['DATA INÍCIO'] || b['DATA FIM'])
      
      if (!dateA && !dateB) return 0
      if (!dateA) return 1 // Projetos sem data vão pro final
      if (!dateB) return -1
      
      return dateA - dateB
    })
    
    return projects
  }, [allProjects, selectedCategory, dateFrom, dateTo])

  // Efeito para navegação por teclado em modo apresentação (APÓS filteredProjects)
  useEffect(() => {
    if (!presentationMode) return

    const handleKeyPress = (e) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        setCurrentProjectIndex(prev => 
          prev < filteredProjects.length - 1 ? prev + 1 : prev
        )
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        setCurrentProjectIndex(prev => prev > 0 ? prev - 1 : prev)
      } else if (e.key === 'Escape') {
        e.preventDefault()
        setPresentationMode(false)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [presentationMode, filteredProjects.length])

  const projectsByMonth = useMemo(() => {
    if (selectedCategory !== 'Todos') {
      return null
    }

    const grouped = {}
    filteredProjects.forEach(project => {
      const date = parseDate(project['DATA INÍCIO'])
      if (!date) {
        if (!grouped['sem-data']) grouped['sem-data'] = []
        grouped['sem-data'].push(project)
      } else {
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`        
        if (!grouped[monthKey]) grouped[monthKey] = []
        grouped[monthKey].push(project)
      }
    })
    
    return grouped
  }, [filteredProjects, selectedCategory])

  const categoryNames = categories ? Object.keys(categories) : []

  useEffect(() => {
    const timeline = timelineRef.current
    if (!timeline || selectedCategory !== 'Todos') return

    const handleTimelineScroll = () => {
      const timelineItems = timeline.querySelectorAll('[data-month]')
      if (timelineItems.length === 0) return

      const timelineRect = timeline.getBoundingClientRect()
      const centerX = timelineRect.left + timelineRect.width / 5

      let closestMonth = null
      let closestDistance = Infinity

      timelineItems.forEach(item => {
        const itemRect = item.getBoundingClientRect()
        const itemCenterX = itemRect.left + itemRect.width / 2
        const distance = Math.abs(itemCenterX - centerX)

        if (distance < closestDistance) {
          closestDistance = distance
          const monthKey = item.getAttribute('data-month')
          if (monthKey === 'sem-data') {
            closestMonth = '📋 Sem Data'
          } else {
            const [year, month] = monthKey.split('-')
            const monthIndex = parseInt(month) - 1 // Corrigir: mês vem como 01-12, mas monthNames é 0-11
            closestMonth = `${monthNames[monthIndex]} de ${year}`
          }
        }
      })

      if (closestMonth) {
        setCurrentMonth(closestMonth)
      }
    }

    timeline.addEventListener('scroll', handleTimelineScroll)
    handleTimelineScroll() 

    return () => timeline.removeEventListener('scroll', handleTimelineScroll)
  }, [selectedCategory, monthNames])

  useEffect(() => {
    if (selectedCategory === 'Todos') {
      setCurrentMonth('Todos')
    }
  }, [selectedCategory])

  return (
    <div className="timeline-container">
      <div className="timeline-header">
        <div className="header-top">
          <h2>📅 Linha do Tempo de Ações e Projetos</h2>
          <span className="project-count">
            {filteredProjects.length} aç{filteredProjects.length !== 1 ? "ões" : "ão"} e projeto{filteredProjects.length !== 1 ? 's' : ''}
          </span>
        </div>
        
        <div className="filter-section">
          <label htmlFor="category-select">Filtrar por Categoria:</label>
          <select 
            id="category-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="category-select"
          >
            <option value="Todos">Todos os Projetos</option>
            {categoryNames.map(categoryName => (
              <option key={categoryName} value={categoryName}>
                {categoryName}
              </option>
            ))}
          </select>

          <div className="date-filters">
            <div className="date-filter-group">
              <label htmlFor="date-from">Data de:</label>
              <input 
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="date-input"
              />
            </div>

            <div className="date-filter-group">
              <label htmlFor="date-to">Data até:</label>
              <input 
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="date-input"
              />
            </div>

            {(dateFrom || dateTo) && (
              <button 
                onClick={() => {
                  setDateFrom('')
                  setDateTo('')
                }}
                className="btn-clear-dates"
              >
                Limpar Datas
              </button>
            )}
          </div>
        </div>
      </div>

      {selectedCategory === 'Todos' && (
        <div className="month-indicator-wrapper">
          <div className="month-indicator">
            {currentMonth}
          </div>
        </div>
      )}

      {presentationMode ? (
        // Modo Apresentação - Timeline em Fullscreen com Navegação
        <div className="presentation-fullscreen">
          <button 
            className="btn-exit-presentation"
            onClick={() => setPresentationMode(false)}
            title="Sair (ESC)"
          >
            ✕ Sair da Apresentação
          </button>

          {/* Header com Mês/Ano */}
          {filteredProjects.length > 0 && (
            <div className="presentation-header">
              <h2>{getProjectMonthYear(filteredProjects[currentProjectIndex])}</h2>
            </div>
          )}

          <div className="presentation-timeline-wrapper">
            <div className="timeline presentation-timeline" ref={presentationTimelineRef}>
              {filteredProjects.length === 0 ? (
                <div className="empty-state">
                  <p>Nenhum projeto encontrado nesta categoria.</p>
                </div>
              ) : (
                filteredProjects.map((project, index) => {
                  const date = parseDate(project['DATA INÍCIO'])
                  const monthKey = date 
                    ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
                    : 'sem-data'
                  const isSelected = index === currentProjectIndex
                  
                  return (
                    <div 
                      key={index} 
                      className={`timeline-item presentation-timeline-item ${isSelected ? 'selected' : ''}`}
                      data-month={monthKey}
                      onClick={() => setCurrentProjectIndex(index)}
                    >
                      <div className="timeline-marker"></div>
                      <div className="timeline-content">
                        <div className="project-header">
                          <h3>{project['PROJETOS / AÇÕES'] || project.PROJETO || 'Projeto sem título'}</h3>
                          <span className={`status-badge status-${project['STATUS ']?.toLowerCase().replace(/\s+/g, '-') || 'indefinido'}`}>
                            {project['STATUS '] || 'Indefinido'}
                          </span>
                        </div>
                        
                        <div className="project-details">
                          <p><strong>📆 Início:</strong> {project['DATA INÍCIO'] || "Não Informado"}</p>
                          <p><strong>📆 Fim:</strong> {project['DATA FIM'] || "Não Informado"}</p>
                          <p><strong>✅ Objetivo Estratégico:</strong> {project['OBJETIVO ESTRATÉGICO'] || "Não Informado"}</p>
                          <p><strong>📄 Resumo:</strong> {project['RESUMO DO PROJETO'] || "Não Informado"}</p>
                          <p><strong>🔗 Link no SA:</strong> <a href={project['LINK SA']} target="_blank" rel="noopener noreferrer">{project['LINK SA'] ? "Clique aqui!" : "Não informado"}</a></p>
                        </div>

                        <div className="project-category">
                          <span className={`category-badge category-${project.category.toLowerCase().replace(/\s+/g, '-')}`}>
                            {project.category}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Info Card com Missão e Visão */}
          {filteredProjects.length > 0 && (
            <div className="presentation-info-card">
              <div className="mission-vision-container">
                <div className="mission-box">
                  <h3>🎯 Missão</h3>
                  <p>Proporcionar assistência à saúde de forma inovadora, qualificada e humanizada.</p>
                </div>
                <div className="vision-box">
                  <h3>🌟 Visão</h3>
                  <p>Ser um hospital regional de referência estadual até 2025.</p>
                </div>
              </div>

              <div className="info-card-footer">
                <button 
                  className="nav-arrow-btn prev"
                  onClick={() => setCurrentProjectIndex(prev => prev > 0 ? prev - 1 : prev)}
                  disabled={currentProjectIndex === 0}
                  title="Anterior (← Seta Esquerda)"
                >
                  ← Anterior
                </button>

                <span className="progress-counter">
                  {currentProjectIndex + 1} / {filteredProjects.length}
                </span>

                <button 
                  className="nav-arrow-btn next"
                  onClick={() => setCurrentProjectIndex(prev => prev < filteredProjects.length - 1 ? prev + 1 : prev)}
                  disabled={currentProjectIndex === filteredProjects.length - 1}
                  title="Próximo (→ Seta Direita)"
                >
                  Próximo →
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        // Modo Normal
        <>
          <div className="timeline" ref={timelineRef}>
            {filteredProjects.length === 0 ? (
              <div className="empty-state">
                <p>Nenhum projeto encontrado nesta categoria.</p>
              </div>
            ) : (
              <>
                <button 
                  className="btn-presentation"
                  onClick={() => {
                    setPresentationMode(true)
                    setCurrentProjectIndex(0)
                  }}
                  title="Ativar Modo Apresentação (Tela Cheia)"
                >
                  🎬 Modo Apresentação
                </button>

                {filteredProjects.map((project, index) => {
                  const date = parseDate(project['DATA INÍCIO'])
                  const monthKey = date 
                    ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
                    : 'sem-data'
                  
                  return (
                    <div key={index} className="timeline-item" data-month={monthKey}>
                      <div className="timeline-marker"></div>
                      <div className="timeline-content">
                        <div className="project-header">
                          <h3>{project['PROJETOS / AÇÕES'] || project.PROJETO || 'Projeto sem título'}</h3>
                          <span className={`status-badge status-${project['STATUS ']?.toLowerCase().replace(/\s+/g, '-') || 'indefinido'}`}>
                            {project['STATUS '] || 'Indefinido'}
                          </span>
                        </div>
                        
                        <div className="project-details">
                          <p><strong>👤 Responsável:</strong> {project.RESPONSÁVEL || "Não Informado"}</p>
                          <p><strong>📆 Início:</strong> {project['DATA INÍCIO'] || "Não Informado"}</p>
                          <p><strong>📆 Fim:</strong> {project['DATA FIM'] || "Não Informado"}</p>
                          <p><strong>✅ Objetivo Estratégico:</strong> {project['OBJETIVO ESTRATÉGICO'] || "Não Informado"}</p>
                          <p><strong>📄 Resumo :</strong> {project['RESUMO DO PROJETO'] || "Não Informado"}</p>
                          <p> <strong> 🔗 Link no SA: </strong> <a href={project['LINK SA']} target="_blank"> {(project['LINK SA']) ? "Clique aqui!" : "Não informado"} </a></p>
                        </div>

                        <div className="project-category">
                          <span className={`category-badge category-${project.category.toLowerCase().replace(/\s+/g, '-')}`}>
                            {project.category}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default Timeline
