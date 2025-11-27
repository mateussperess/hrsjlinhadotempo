import { useState, useMemo } from 'react'
import '../styles/Timeline.css'

function Timeline({ categories }) {
  const [selectedCategory, setSelectedCategory] = useState('Todos')

  // Obter todos os projetos
  const allProjects = useMemo(() => {
    if (!categories) return []
    
    let projects = []
    Object.entries(categories).forEach(([categoryName, items]) => {
      projects = projects.concat(
        items.map(item => ({
          ...item,
          category: categoryName
        }))
      )
    })
    return projects
  }, [categories])

  // Filtrar projetos por categoria
  const filteredProjects = useMemo(() => {
    if (selectedCategory === 'Todos') {
      return allProjects
    }
    return allProjects.filter(project => project.category === selectedCategory)
  }, [allProjects, selectedCategory])

  const categoryNames = categories ? Object.keys(categories) : []

  return (
    <div className="timeline-container">
      <div className="timeline-header">
        <h2>📅 Linha do Tempo de Projetos</h2>
        
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
          <span className="project-count">
            {filteredProjects.length} projeto{filteredProjects.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="timeline">
        {filteredProjects.length === 0 ? (
          <div className="empty-state">
            <p>Nenhum projeto encontrado nesta categoria.</p>
          </div>
        ) : (
          filteredProjects.map((project, index) => (
            <div key={index} className="timeline-item">
              <div className="timeline-marker"></div>
              <div className="timeline-content">
                <div className="project-header">
                  <h3>{project.PROJETO || 'Projeto sem título'}</h3>
                  <span className={`status-badge status-${project['STATUS ']?.toLowerCase().replace(/\s+/g, '-') || 'indefinido'}`}>
                    {project['STATUS '] || 'Indefinido'}
                  </span>
                </div>
                
                <div className="project-details">
                  {project.RESPONSÁVEL && (
                    <p><strong>👤 Responsável:</strong> {project.RESPONSÁVEL}</p>
                  )}
                  {project['DATA INÍCIO'] && (
                    <p><strong>📅 Início:</strong> {project['DATA INÍCIO']}</p>
                  )}
                  {project.INVESTIMENTO && (
                    <p><strong>💰 Investimento:</strong> {project.INVESTIMENTO}</p>
                  )}
                  {project['ORIGEM DO \nINVESTIMENTO'] && (
                    <p><strong>🏦 Origem:</strong> {project['ORIGEM DO \nINVESTIMENTO']}</p>
                  )}
                  {project['CRITÉRIO DE IMPORTÂNCIA'] && (
                    <p><strong>⭐ Importância:</strong> {project['CRITÉRIO DE IMPORTÂNCIA']}</p>
                  )}
                </div>

                <div className="project-category">
                  <span className={`category-badge category-${project.category.toLowerCase().replace(/\s+/g, '-')}`}>
                    {project.category}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Timeline
