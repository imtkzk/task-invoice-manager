import { useState, useEffect } from 'react'
import axios from 'axios'
import TimeTracker from './TimeTracker'

const API_BASE_URL = '/api'

function TasksTab({ projects, selectedProject, onSelectProject }) {
  const [tasks, setTasks] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [showTimeTracker, setShowTimeTracker] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [editingTask, setEditingTask] = useState(null)
  const [formData, setFormData] = useState({
    project_id: selectedProject?.id || '',
    title: '',
    description: '',
    amount: 0,
    due_date: ''
  })

  useEffect(() => {
    if (selectedProject) {
      loadTasks(selectedProject.id)
    } else {
      loadTasks()
    }
  }, [selectedProject])

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
      if (editingTask) {
        await axios.put(`${API_BASE_URL}/tasks/${editingTask.id}`, formData)
      } else {
        await axios.post(`${API_BASE_URL}/tasks`, formData)
      }

      loadTasks(selectedProject?.id)
      setShowModal(false)
      setFormData({
        project_id: selectedProject?.id || '',
        title: '',
        description: '',
        amount: 0,
        due_date: ''
      })
      setEditingTask(null)
    } catch (error) {
      console.error('Error saving task:', error)
      alert('タスクの保存に失敗しました')
    }
  }

  const handleToggleComplete = async (task) => {
    try {
      await axios.put(`${API_BASE_URL}/tasks/${task.id}`, {
        ...task,
        is_completed: task.is_completed ? 0 : 1
      })
      loadTasks(selectedProject?.id)
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const handleEdit = (task) => {
    setEditingTask(task)
    setFormData({
      project_id: task.project_id || '',
      title: task.title,
      description: task.description || '',
      amount: task.amount || 0,
      due_date: task.due_date || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('このタスクを削除してもよろしいですか？')) {
      return
    }

    try {
      await axios.delete(`${API_BASE_URL}/tasks/${id}`)
      loadTasks(selectedProject?.id)
    } catch (error) {
      console.error('Error deleting task:', error)
      alert('タスクの削除に失敗しました')
    }
  }

  const openTimeTracker = (task) => {
    setSelectedTask(task)
    setShowTimeTracker(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingTask(null)
    setFormData({
      project_id: selectedProject?.id || '',
      title: '',
      description: '',
      amount: 0,
      due_date: ''
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

      <div>
        {tasks.map((task) => (
          <div key={task.id} className={`task-item ${task.is_completed ? 'completed' : ''}`}>
            <input
              type="checkbox"
              checked={!!task.is_completed}
              onChange={() => handleToggleComplete(task)}
            />
            <div className="task-content">
              <div className="task-title" style={task.is_completed ? { textDecoration: 'line-through' } : {}}>
                {task.title}
              </div>
              <div className="task-meta">
                {task.description && <span>{task.description} | </span>}
                {task.amount > 0 && <span>金額: ¥{task.amount.toLocaleString()} | </span>}
                {task.due_date && <span>期限: {task.due_date}</span>}
              </div>
            </div>
            <div className="task-actions">
              <button className="btn btn-secondary" onClick={() => openTimeTracker(task)}>
                時間記録
              </button>
              <button className="btn btn-secondary" onClick={() => handleEdit(task)}>
                編集
              </button>
              <button className="btn btn-danger" onClick={() => handleDelete(task.id)}>
                削除
              </button>
            </div>
          </div>
        ))}
      </div>

      {tasks.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
          タスクがありません。新規作成してください。
        </div>
      )}

      {showModal && (
        <div className="modal" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingTask ? 'タスク編集' : '新規タスク'}</h2>
              <button className="close-btn" onClick={closeModal}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>プロジェクト</label>
                <select
                  value={formData.project_id}
                  onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                >
                  <option value="">プロジェクトなし</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
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
                <label>期限</label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  キャンセル
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingTask ? '更新' : '作成'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTimeTracker && selectedTask && (
        <TimeTracker
          task={selectedTask}
          onClose={() => {
            setShowTimeTracker(false)
            setSelectedTask(null)
          }}
        />
      )}
    </div>
  )
}

export default TasksTab
