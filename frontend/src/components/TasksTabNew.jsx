import { useState, useEffect } from 'react'
import axios from 'axios'
import KanbanBoard from './KanbanBoard'
import TaskDetailModal from './TaskDetailModal'

const API_BASE_URL = '/api'

function TasksTabNew({ projects, selectedProject, onSelectProject }) {
  const [tasks, setTasks] = useState([])
  const [companies, setCompanies] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [formData, setFormData] = useState({
    company_id: '',
    title: '',
    description: '',
    amount: 0,
    rate_type: 'spot',
    status: 'pending',
    invoice_status: 'not_invoiced'
  })

  useEffect(() => {
    loadCompanies()
    if (selectedProject) {
      loadTasks(selectedProject.id)
    } else {
      loadTasks()
    }
  }, [selectedProject])

  const loadCompanies = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/companies`)
      setCompanies(response.data)
    } catch (error) {
      console.error('Error loading companies:', error)
    }
  }

  const loadTasks = async (projectId = null) => {
    try {
      const url = projectId
        ? `${API_BASE_URL}/tasks?project_id=${projectId}`
        : `${API_BASE_URL}/tasks`
      const response = await axios.get(url)
      setTasks(response.data)
    } catch (error) {
      console.error('Error loading tasks:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      await axios.post(`${API_BASE_URL}/tasks`, formData)
      loadTasks(selectedProject?.id)
      setShowModal(false)
      setFormData({
        company_id: '',
        title: '',
        description: '',
        amount: 0,
        rate_type: 'spot',
        status: 'pending',
        invoice_status: 'not_invoiced'
      })
    } catch (error) {
      console.error('Error creating task:', error)
      alert('タスクの作成に失敗しました')
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setFormData({
      company_id: '',
      title: '',
      description: '',
      amount: 0,
      rate_type: 'spot',
      status: 'pending',
      invoice_status: 'not_invoiced'
    })
  }

  return (
    <div>
      <div className="project-select">
        <select
          value={selectedProject?.id || ''}
          onChange={(e) => {
            const project = projects.find((p) => p.id === parseInt(e.target.value))
            onSelectProject(project || null)
          }}
        >
          <option value="">すべてのプロジェクト</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          新規タスク作成
        </button>
      </div>

      <KanbanBoard
        tasks={tasks}
        onTaskUpdate={() => loadTasks(selectedProject?.id)}
        onTaskClick={(task) => setSelectedTask(task)}
      />

      {showModal && (
        <div className="modal" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>新規タスク</h2>
              <button className="close-btn" onClick={closeModal}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>会社</label>
                <select
                  value={formData.company_id}
                  onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                >
                  <option value="">会社なし</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>タスク名 *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>説明</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>金額（円）</label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    min="0"
                    step="100"
                  />
                </div>
                <div className="form-group">
                  <label>単価感</label>
                  <select
                    value={formData.rate_type}
                    onChange={(e) => setFormData({ ...formData, rate_type: e.target.value })}
                  >
                    <option value="hourly">時給</option>
                    <option value="monthly">月給</option>
                    <option value="spot">スポット</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  キャンセル
                </button>
                <button type="submit" className="btn btn-primary">
                  作成
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          companies={companies}
          onClose={() => setSelectedTask(null)}
          onUpdate={() => {
            loadTasks(selectedProject?.id)
            setSelectedTask(null)
          }}
          onDelete={() => {
            loadTasks(selectedProject?.id)
            setSelectedTask(null)
          }}
          onCompaniesChange={loadCompanies}
        />
      )}
    </div>
  )
}

export default TasksTabNew
