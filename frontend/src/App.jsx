import { useState, useEffect } from 'react'
import axios from 'axios'
import CompaniesTab from './components/CompaniesTab'
import ProjectsTab from './components/ProjectsTab'
import TasksTabNew from './components/TasksTabNew'
import InvoicesTab from './components/InvoicesTab'

const API_BASE_URL = '/api'

function App() {
  const [activeTab, setActiveTab] = useState('tasks')
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/projects`)
      setProjects(response.data)
    } catch (error) {
      console.error('Error loading projects:', error)
    }
  }

  return (
    <div className="container">
      <div className="header">
        <h1>タスク・請求書管理システム</h1>
        <p>プロジェクト管理、タスク追跡、時間記録、請求書生成を一元管理</p>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          タスク
        </button>
        <button
          className={`tab ${activeTab === 'companies' ? 'active' : ''}`}
          onClick={() => setActiveTab('companies')}
        >
          会社
        </button>
        <button
          className={`tab ${activeTab === 'projects' ? 'active' : ''}`}
          onClick={() => setActiveTab('projects')}
        >
          プロジェクト
        </button>
        <button
          className={`tab ${activeTab === 'invoices' ? 'active' : ''}`}
          onClick={() => setActiveTab('invoices')}
        >
          請求書
        </button>
      </div>

      {activeTab === 'tasks' && (
        <TasksTabNew
          projects={projects}
          selectedProject={selectedProject}
          onSelectProject={setSelectedProject}
        />
      )}

      {activeTab === 'companies' && (
        <CompaniesTab />
      )}

      {activeTab === 'projects' && (
        <ProjectsTab
          projects={projects}
          onProjectsChange={loadProjects}
          onSelectProject={setSelectedProject}
        />
      )}

      {activeTab === 'invoices' && (
        <InvoicesTab
          projects={projects}
          selectedProject={selectedProject}
          onSelectProject={setSelectedProject}
        />
      )}
    </div>
  )
}

export default App
