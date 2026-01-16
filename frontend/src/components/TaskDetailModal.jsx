import { useState, useEffect } from 'react'
import axios from 'axios'
import TimeTracker from './TimeTracker'

const API_BASE_URL = '/api'

const STATUS_OPTIONS = [
  { value: 'pending', label: '提出待ち' },
  { value: 'in_progress', label: '着手中' },
  { value: 'requesting', label: '依頼中' },
  { value: 'waiting', label: '待機' },
  { value: 'completed', label: '完了' }
]

const INVOICE_STATUS_OPTIONS = [
  { value: 'not_invoiced', label: '未請求' },
  { value: 'invoice_ready', label: '請求OK' },
  { value: 'invoiced', label: '請求済み' },
  { value: 'paid', label: '完了' }
]

function TaskDetailModal({ task, projects, onClose, onUpdate, onDelete }) {
  const [formData, setFormData] = useState({
    project_id: '',
    title: '',
    description: '',
    amount: 0,
    status: 'pending',
    invoice_status: 'not_invoiced',
    due_date: ''
  })
  const [showTimeTracker, setShowTimeTracker] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    if (task) {
      setFormData({
        project_id: task.project_id || '',
        title: task.title,
        description: task.description || '',
        amount: task.amount || 0,
        status: task.status || 'pending',
        invoice_status: task.invoice_status || 'not_invoiced',
        due_date: task.due_date || ''
      })
    }
  }, [task])

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      await axios.put(`${API_BASE_URL}/tasks/${task.id}`, formData)
      onUpdate()
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating task:', error)
      alert('タスクの更新に失敗しました')
    }
  }

  const handleDelete = async () => {
    if (!confirm('このタスクを削除してもよろしいですか？')) {
      return
    }

    try {
      await axios.delete(`${API_BASE_URL}/tasks/${task.id}`)
      onDelete()
      onClose()
    } catch (error) {
      console.error('Error deleting task:', error)
      alert('タスクの削除に失敗しました')
    }
  }

  if (!task) return null

  const project = projects.find(p => p.id === task.project_id)

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>タスク詳細</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {!isEditing ? (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '24px', marginBottom: '10px' }}>{task.title}</h3>

              {project && (
                <div style={{ fontSize: '14px', color: '#667eea', marginBottom: '10px' }}>
                  プロジェクト: {project.name}
                </div>
              )}

              {task.description && (
                <p style={{ color: '#666', marginBottom: '15px', lineHeight: '1.6' }}>
                  {task.description}
                </p>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div className="card" style={{ padding: '15px' }}>
                  <div style={{ fontSize: '12px', color: '#888', marginBottom: '5px' }}>ステータス</div>
                  <div style={{ fontWeight: '600' }}>
                    {STATUS_OPTIONS.find(s => s.value === task.status)?.label || task.status}
                  </div>
                </div>

                <div className="card" style={{ padding: '15px' }}>
                  <div style={{ fontSize: '12px', color: '#888', marginBottom: '5px' }}>請求ステータス</div>
                  <div style={{ fontWeight: '600' }}>
                    {INVOICE_STATUS_OPTIONS.find(s => s.value === task.invoice_status)?.label || task.invoice_status}
                  </div>
                </div>

                {task.amount > 0 && (
                  <div className="card" style={{ padding: '15px' }}>
                    <div style={{ fontSize: '12px', color: '#888', marginBottom: '5px' }}>金額</div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#667eea' }}>
                      ¥{task.amount.toLocaleString()}
                    </div>
                  </div>
                )}

                {task.due_date && (
                  <div className="card" style={{ padding: '15px' }}>
                    <div style={{ fontSize: '12px', color: '#888', marginBottom: '5px' }}>期限</div>
                    <div style={{ fontWeight: '600' }}>{task.due_date}</div>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
                編集
              </button>
              <button className="btn btn-secondary" onClick={() => setShowTimeTracker(true)}>
                時間記録
              </button>
              <button className="btn btn-danger" onClick={handleDelete}>
                削除
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
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
                rows={4}
              />
            </div>

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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="form-group">
                <label>ステータス</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  {STATUS_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>請求ステータス</label>
                <select
                  value={formData.invoice_status}
                  onChange={(e) => setFormData({ ...formData, invoice_status: e.target.value })}
                >
                  {INVOICE_STATUS_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
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
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(false)}>
                キャンセル
              </button>
              <button type="submit" className="btn btn-primary">
                保存
              </button>
            </div>
          </form>
        )}

        {showTimeTracker && (
          <TimeTracker
            task={task}
            onClose={() => setShowTimeTracker(false)}
          />
        )}
      </div>
    </div>
  )
}

export default TaskDetailModal
