import { useState, useEffect } from 'react'
import axios from 'axios'

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

const RATE_TYPE_OPTIONS = [
  { value: 'hourly', label: '時給' },
  { value: 'monthly', label: '月給' },
  { value: 'spot', label: 'スポット' }
]

function TaskDetailModal({ task, companies, onClose, onUpdate, onDelete, onCompaniesChange }) {
  const [formData, setFormData] = useState({
    company_id: '',
    title: '',
    description: '',
    amount: 0,
    rate_type: 'spot',
    status: 'pending',
    invoice_status: 'not_invoiced'
  })
  const [isEditing, setIsEditing] = useState(false)
  const [showCompanyForm, setShowCompanyForm] = useState(false)
  const [editingCompany, setEditingCompany] = useState(null)
  const [companyFormData, setCompanyFormData] = useState({ name: '' })

  useEffect(() => {
    if (task) {
      setFormData({
        company_id: task.company_id || '',
        title: task.title,
        description: task.description || '',
        amount: task.amount || 0,
        rate_type: task.rate_type || 'spot',
        status: task.status || 'pending',
        invoice_status: task.invoice_status || 'not_invoiced'
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

  const handleCompanySubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingCompany) {
        await axios.put(`${API_BASE_URL}/companies/${editingCompany.id}`, companyFormData)
      } else {
        const response = await axios.post(`${API_BASE_URL}/companies`, companyFormData)
        setFormData({ ...formData, company_id: response.data.id })
      }
      onCompaniesChange()
      setShowCompanyForm(false)
      setEditingCompany(null)
      setCompanyFormData({ name: '' })
    } catch (error) {
      console.error('Error saving company:', error)
      alert('会社の保存に失敗しました')
    }
  }

  const handleEditCompany = (company) => {
    setEditingCompany(company)
    setCompanyFormData({ name: company.name })
    setShowCompanyForm(true)
  }

  if (!task) return null

  const company = companies.find(c => c.id === task.company_id)

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ visibility: 'hidden' }}>_</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {!isEditing ? (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '24px', marginBottom: '10px' }}>{task.title}</h3>

              {company && (
                <div style={{ fontSize: '14px', color: '#667eea', marginBottom: '10px' }}>
                  会社: {company.name}
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

                <div className="card" style={{ padding: '15px' }}>
                  <div style={{ fontSize: '12px', color: '#888', marginBottom: '5px' }}>単価感</div>
                  <div style={{ fontWeight: '600' }}>
                    {RATE_TYPE_OPTIONS.find(r => r.value === task.rate_type)?.label || 'スポット'}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
                編集
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
              <label>会社</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <select
                  value={formData.company_id}
                  onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                  style={{ flex: 1 }}
                >
                  <option value="">会社なし</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '8px 12px', fontSize: '14px' }}
                  onClick={() => {
                    setEditingCompany(null)
                    setCompanyFormData({ name: '' })
                    setShowCompanyForm(true)
                  }}
                >
                  +
                </button>
                {formData.company_id && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '8px 12px', fontSize: '14px' }}
                    onClick={() => {
                      const selectedCompany = companies.find(c => c.id === parseInt(formData.company_id))
                      if (selectedCompany) handleEditCompany(selectedCompany)
                    }}
                  >
                    編集
                  </button>
                )}
              </div>
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
                <label>単価感</label>
                <select
                  value={formData.rate_type}
                  onChange={(e) => setFormData({ ...formData, rate_type: e.target.value })}
                >
                  {RATE_TYPE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
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

        {showCompanyForm && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1001
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              minWidth: '300px'
            }}>
              <h3 style={{ marginBottom: '15px' }}>
                {editingCompany ? '会社を編集' : '会社を追加'}
              </h3>
              <form onSubmit={handleCompanySubmit}>
                <div className="form-group">
                  <label>会社名 *</label>
                  <input
                    type="text"
                    value={companyFormData.name}
                    onChange={(e) => setCompanyFormData({ ...companyFormData, name: e.target.value })}
                    required
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowCompanyForm(false)
                      setEditingCompany(null)
                      setCompanyFormData({ name: '' })
                    }}
                  >
                    キャンセル
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingCompany ? '更新' : '追加'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TaskDetailModal
