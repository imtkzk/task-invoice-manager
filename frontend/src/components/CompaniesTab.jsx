import { useState, useEffect } from 'react'
import axios from 'axios'

const API_BASE_URL = '/api'

function CompaniesTab() {
  const [companies, setCompanies] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingCompany, setEditingCompany] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: ''
  })

  useEffect(() => {
    loadCompanies()
  }, [])

  const loadCompanies = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/companies`)
      setCompanies(response.data)
    } catch (error) {
      console.error('Error loading companies:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      if (editingCompany) {
        await axios.put(`${API_BASE_URL}/companies/${editingCompany.id}`, formData)
      } else {
        await axios.post(`${API_BASE_URL}/companies`, formData)
      }

      loadCompanies()
      setShowModal(false)
      setFormData({ name: '', contact_person: '', email: '', phone: '', address: '' })
      setEditingCompany(null)
    } catch (error) {
      console.error('Error saving company:', error)
      alert('会社情報の保存に失敗しました')
    }
  }

  const handleEdit = (company) => {
    setEditingCompany(company)
    setFormData({
      name: company.name,
      contact_person: company.contact_person || '',
      email: company.email || '',
      phone: company.phone || '',
      address: company.address || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('この会社を削除してもよろしいですか？関連するプロジェクトの会社情報もクリアされます。')) {
      return
    }

    try {
      await axios.delete(`${API_BASE_URL}/companies/${id}`)
      loadCompanies()
    } catch (error) {
      console.error('Error deleting company:', error)
      alert('会社の削除に失敗しました')
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingCompany(null)
    setFormData({ name: '', contact_person: '', email: '', phone: '', address: '' })
  }

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          新規会社登録
        </button>
      </div>

      <div className="grid">
        {companies.map((company) => (
          <div key={company.id} className="card">
            <h3 style={{ marginBottom: '10px', color: '#667eea' }}>{company.name}</h3>
            {company.contact_person && (
              <p style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
                担当者: {company.contact_person}
              </p>
            )}
            {company.email && (
              <p style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
                メール: {company.email}
              </p>
            )}
            {company.phone && (
              <p style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
                電話: {company.phone}
              </p>
            )}
            {company.address && (
              <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
                住所: {company.address}
              </p>
            )}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-secondary" onClick={() => handleEdit(company)}>
                編集
              </button>
              <button className="btn btn-danger" onClick={() => handleDelete(company.id)}>
                削除
              </button>
            </div>
          </div>
        ))}
      </div>

      {companies.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
          会社がありません。新規登録してください。
        </div>
      )}

      {showModal && (
        <div className="modal" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingCompany ? '会社情報編集' : '新規会社登録'}</h2>
              <button className="close-btn" onClick={closeModal}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>会社名 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>担当者名</label>
                <input
                  type="text"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>メールアドレス</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>電話番号</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>住所</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={2}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  キャンセル
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingCompany ? '更新' : '登録'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default CompaniesTab
