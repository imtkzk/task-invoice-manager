import { useState, useEffect } from 'react'
import axios from 'axios'

const API_BASE_URL = '/api'

function InvoicesTab({ projects, selectedProject, onSelectProject }) {
  const [invoices, setInvoices] = useState([])
  const [tasks, setTasks] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    project_id: selectedProject?.id || '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: '',
    notes: '',
    task_ids: []
  })

  useEffect(() => {
    loadInvoices()
  }, [selectedProject])

  useEffect(() => {
    if (formData.project_id) {
      loadProjectTasks(formData.project_id)
    } else {
      setTasks([])
    }
  }, [formData.project_id])

  const loadInvoices = async () => {
    try {
      const url = selectedProject
        ? `${API_BASE_URL}/invoices?project_id=${selectedProject.id}`
        : `${API_BASE_URL}/invoices`
      const response = await axios.get(url)
      setInvoices(response.data)
    } catch (error) {
      console.error('Error loading invoices:', error)
    }
  }

  const loadProjectTasks = async (projectId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/tasks?project_id=${projectId}`)
      setTasks(response.data.filter((task) => !task.is_completed || task.amount > 0))
    } catch (error) {
      console.error('Error loading tasks:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.project_id) {
      alert('プロジェクトを選択してください')
      return
    }

    try {
      await axios.post(`${API_BASE_URL}/invoices`, formData)
      loadInvoices()
      setShowModal(false)
      setFormData({
        project_id: selectedProject?.id || '',
        issue_date: new Date().toISOString().split('T')[0],
        due_date: '',
        notes: '',
        task_ids: []
      })
    } catch (error) {
      console.error('Error creating invoice:', error)
      alert('請求書の作成に失敗しました')
    }
  }

  const downloadPDF = async (invoiceId, invoiceNumber) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/invoices/${invoiceId}/pdf`, {
        responseType: 'blob'
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `invoice-${invoiceNumber}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('Error downloading PDF:', error)
      alert('PDFのダウンロードに失敗しました')
    }
  }

  const updateStatus = async (id, status) => {
    try {
      await axios.put(`${API_BASE_URL}/invoices/${id}`, { status })
      loadInvoices()
    } catch (error) {
      console.error('Error updating invoice status:', error)
      alert('ステータスの更新に失敗しました')
    }
  }

  const deleteInvoice = async (id) => {
    if (!confirm('この請求書を削除してもよろしいですか？')) {
      return
    }

    try {
      await axios.delete(`${API_BASE_URL}/invoices/${id}`)
      loadInvoices()
    } catch (error) {
      console.error('Error deleting invoice:', error)
      alert('請求書の削除に失敗しました')
    }
  }

  const toggleTaskSelection = (taskId) => {
    setFormData((prev) => {
      const isSelected = prev.task_ids.includes(taskId)
      return {
        ...prev,
        task_ids: isSelected
          ? prev.task_ids.filter((id) => id !== taskId)
          : [...prev.task_ids, taskId]
      }
    })
  }

  const closeModal = () => {
    setShowModal(false)
    setFormData({
      project_id: selectedProject?.id || '',
      issue_date: new Date().toISOString().split('T')[0],
      due_date: '',
      notes: '',
      task_ids: []
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
          新規請求書作成
        </button>
      </div>

      <ul className="invoice-list">
        {invoices.map((invoice) => {
          const project = projects.find((p) => p.id === invoice.project_id)
          return (
            <li key={invoice.id} className="invoice-item">
              <div className="invoice-info">
                <h3>{invoice.invoice_number}</h3>
                {project && <p className="invoice-meta">プロジェクト: {project.name}</p>}
                <p className="invoice-meta">発行日: {invoice.issue_date}</p>
                {invoice.due_date && <p className="invoice-meta">支払期限: {invoice.due_date}</p>}
                <p className="invoice-meta">
                  金額: <strong>¥{invoice.total_amount.toLocaleString()}</strong>
                </p>
                <span className={`status-badge status-${invoice.status}`}>
                  {invoice.status === 'draft' && '下書き'}
                  {invoice.status === 'sent' && '送信済み'}
                  {invoice.status === 'paid' && '支払済み'}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  className="btn btn-primary"
                  onClick={() => downloadPDF(invoice.id, invoice.invoice_number)}
                >
                  PDFダウンロード
                </button>
                {invoice.status === 'draft' && (
                  <button
                    className="btn btn-secondary"
                    onClick={() => updateStatus(invoice.id, 'sent')}
                  >
                    送信済みにする
                  </button>
                )}
                {invoice.status === 'sent' && (
                  <button
                    className="btn btn-success"
                    onClick={() => updateStatus(invoice.id, 'paid')}
                  >
                    支払済みにする
                  </button>
                )}
                <button className="btn btn-danger" onClick={() => deleteInvoice(invoice.id)}>
                  削除
                </button>
              </div>
            </li>
          )
        })}
      </ul>

      {invoices.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
          請求書がありません。新規作成してください。
        </div>
      )}

      {showModal && (
        <div className="modal" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>新規請求書作成</h2>
              <button className="close-btn" onClick={closeModal}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>プロジェクト *</label>
                <select
                  value={formData.project_id}
                  onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                  required
                >
                  <option value="">選択してください</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              {tasks.length > 0 && (
                <div className="form-group">
                  <label>含めるタスク（選択しない場合はすべて含まれます）</label>
                  <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '6px', padding: '10px' }}>
                    {tasks.map((task) => (
                      <label key={task.id} style={{ display: 'block', marginBottom: '8px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={formData.task_ids.includes(task.id)}
                          onChange={() => toggleTaskSelection(task.id)}
                          style={{ marginRight: '10px' }}
                        />
                        {task.title} {task.amount > 0 && `(¥${task.amount.toLocaleString()})`}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>発行日 *</label>
                <input
                  type="date"
                  value={formData.issue_date}
                  onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>支払期限</label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>備考</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  placeholder="支払い方法などの追加情報"
                />
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
    </div>
  )
}

export default InvoicesTab
