import { useState, useEffect } from 'react'
import axios from 'axios'

const API_BASE_URL = '/api'

function TimeTracker({ task, onClose }) {
  const [timeEntries, setTimeEntries] = useState([])
  const [isTracking, setIsTracking] = useState(false)
  const [startTime, setStartTime] = useState(null)
  const [currentDuration, setCurrentDuration] = useState(0)
  const [manualMinutes, setManualMinutes] = useState(0)
  const [description, setDescription] = useState('')

  useEffect(() => {
    loadTimeEntries()
  }, [task.id])

  useEffect(() => {
    let interval
    if (isTracking && startTime) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000 / 60)
        setCurrentDuration(elapsed)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isTracking, startTime])

  const loadTimeEntries = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/time-entries?task_id=${task.id}`)
      setTimeEntries(response.data)
    } catch (error) {
      console.error('Error loading time entries:', error)
    }
  }

  const startTracking = () => {
    setStartTime(Date.now())
    setIsTracking(true)
    setCurrentDuration(0)
  }

  const stopTracking = async () => {
    if (!startTime) return

    const endTime = Date.now()
    const durationMinutes = Math.floor((endTime - startTime) / 1000 / 60)

    try {
      await axios.post(`${API_BASE_URL}/time-entries`, {
        task_id: task.id,
        duration_minutes: durationMinutes,
        description: description,
        started_at: new Date(startTime).toISOString(),
        ended_at: new Date(endTime).toISOString()
      })

      setIsTracking(false)
      setStartTime(null)
      setCurrentDuration(0)
      setDescription('')
      loadTimeEntries()
    } catch (error) {
      console.error('Error saving time entry:', error)
      alert('時間記録の保存に失敗しました')
    }
  }

  const addManualEntry = async () => {
    if (manualMinutes <= 0) {
      alert('時間を入力してください')
      return
    }

    try {
      await axios.post(`${API_BASE_URL}/time-entries`, {
        task_id: task.id,
        duration_minutes: manualMinutes,
        description: description
      })

      setManualMinutes(0)
      setDescription('')
      loadTimeEntries()
    } catch (error) {
      console.error('Error saving time entry:', error)
      alert('時間記録の保存に失敗しました')
    }
  }

  const deleteEntry = async (id) => {
    if (!confirm('この時間記録を削除してもよろしいですか?')) {
      return
    }

    try {
      await axios.delete(`${API_BASE_URL}/time-entries/${id}`)
      loadTimeEntries()
    } catch (error) {
      console.error('Error deleting time entry:', error)
      alert('削除に失敗しました')
    }
  }

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}時間 ${mins}分`
  }

  const totalMinutes = timeEntries.reduce((sum, entry) => sum + entry.duration_minutes, 0)

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>時間トラッキング: {task.title}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="card" style={{ marginBottom: '20px' }}>
          <h3>タイマー</h3>
          {!isTracking ? (
            <div>
              <div className="form-group">
                <label>作業内容（任意）</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="何をしましたか？"
                />
              </div>
              <button className="btn btn-success" onClick={startTracking}>
                開始
              </button>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', margin: '20px 0', color: '#667eea' }}>
                {formatDuration(currentDuration)}
              </div>
              <button className="btn btn-danger" onClick={stopTracking}>
                停止して保存
              </button>
            </div>
          )}
        </div>

        <div className="card" style={{ marginBottom: '20px' }}>
          <h3>手動で追加</h3>
          <div className="form-group">
            <label>時間（分）</label>
            <input
              type="number"
              value={manualMinutes}
              onChange={(e) => setManualMinutes(parseInt(e.target.value) || 0)}
              min="0"
              step="15"
            />
          </div>
          <div className="form-group">
            <label>作業内容（任意）</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="何をしましたか？"
            />
          </div>
          <button className="btn btn-primary" onClick={addManualEntry}>
            追加
          </button>
        </div>

        <div>
          <h3>記録された時間 (合計: {formatDuration(totalMinutes)})</h3>
          {timeEntries.length === 0 ? (
            <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>
              まだ時間記録がありません
            </p>
          ) : (
            timeEntries.map((entry) => (
              <div key={entry.id} className="time-entry">
                <div>
                  <div style={{ fontWeight: '500' }}>
                    {formatDuration(entry.duration_minutes)}
                  </div>
                  {entry.description && (
                    <div style={{ fontSize: '14px', color: '#666' }}>{entry.description}</div>
                  )}
                  {entry.started_at && (
                    <div style={{ fontSize: '12px', color: '#999' }}>
                      {new Date(entry.started_at).toLocaleString('ja-JP')}
                    </div>
                  )}
                </div>
                <button
                  className="btn btn-danger"
                  style={{ padding: '5px 10px', fontSize: '12px' }}
                  onClick={() => deleteEntry(entry.id)}
                >
                  削除
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default TimeTracker
