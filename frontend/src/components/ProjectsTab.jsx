import { useState, useEffect } from 'react'
import axios from 'axios'

const API_BASE_URL = '/api'

function ProjectsTab({ projects, onProjectsChange, onSelectProject }) {
  const [showModal, setShowModal] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    client_name: '',
    hourly_rate: 0
  })

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      if (editingProject) {
        await axios.put(`${API_BASE_URL}/projects/${editingProject.id}`, formData)
      } else {
        await axios.post(`${API_BASE_URL}/projects`, formData)
      }

      onProjectsChange()
      setShowModal(false)
      setFormData({ name: '', description: '', client_name: '', hourly_rate: 0 })
      setEditingProject(null)
    } catch (error) {
      console.error('Error saving project:', error)
      alert('プロジェクトの保存に失敗しました')
    }
  }

  const handleEdit = (project) => {
    setEditingProject(project)
    setFormData({
      name: project.name,
      description: project.description || '',
      client_name: project.client_name || '',
      hourly_rate: project.hourly_rate || 0
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('このプロジェクトを削除してもよろしいですか？関連するタスクも削除されます。')) {
      return
    }

    try {
      await axios.delete(`${API_BASE_URL}/projects/${id}`)
      onProjectsChange()
    } catch (error) {
      console.error('Error deleting project:', error)
      alert('プロジェクトの削除に失敗しました')
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingProject(null)
    setFormData({ name: '', description: '', client_name: '', hourly_rate: 0 })
  }

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          新規プロジェクト作成
        </button>
      </div>

      <div className="grid">
        {projects.map((project) => (
          <div key={project.id} className="card">
            <h3 style={{ marginBottom: '10px', color: '#667eea' }}>{project.name}</h3>
            {project.description && (
              <p style={{ marginBottom: '10px', color: '#666' }}>{project.description}</p>
            )}
            {project.client_name && (
              <p style={{ fontSize: '14px', color: '#888', marginBottom: '5px' }}>
                クライアント: {project.client_name}
              </p>
            )}
            {project.hourly_rate > 0 && (
              <p style={{ fontSize: '14px', color: '#888', marginBottom: '15px' }}>
                時給: ¥{project.hourly_rate.toLocaleString()}
              </p>
            )}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-secondary" onClick={() => handleEdit(project)}>
                編集
              </button>
              <button className="btn btn-danger" onClick={() => handleDelete(project.id)}>
                削除
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  onSelectProject(project)
                }}
              >
                タスクを見る
              </button>
            </div>
          </div>
        ))}
      </div>

      {projects.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
          プロジェクトがありません。新規作成してください。
        </div>
      )}

      {showModal && (
        <div className="modal" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingProject ? 'プロジェクト編集' : '新規プロジェクト'}</h2>
              <button className="close-btn" onClick={closeModal}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>プロジェクト名 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                <label>クライアント名</label>
                <input
                  type="text"
                  value={formData.client_name}
                  onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>時給（円）</label>
                <input
                  type="number"
                  value={formData.hourly_rate}
                  onChange={(e) => setFormData({ ...formData, hourly_rate: parseFloat(e.target.value) || 0 })}
                  min="0"
                  step="100"
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  キャンセル
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingProject ? '更新' : '作成'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProjectsTab
