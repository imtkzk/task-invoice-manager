import { useState } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import axios from 'axios'

const API_BASE_URL = '/api'

const STATUS_COLUMNS = [
  { id: 'pending', label: '提出待ち', color: '#f3f4f6' },
  { id: 'in_progress', label: '着手中', color: '#dbeafe' },
  { id: 'requesting', label: '依頼中', color: '#fef3c7' },
  { id: 'waiting', label: '待機', color: '#e5e7eb' },
  { id: 'completed', label: '完了', color: '#d1fae5' }
]

const INVOICE_STATUS_MAP = {
  not_invoiced: '未請求',
  invoice_ready: '請求OK',
  invoiced: '請求済み',
  paid: '完了'
}

const INVOICE_STATUS_COLORS = {
  not_invoiced: '#e5e7eb',
  invoice_ready: '#dbeafe',
  invoiced: '#fde68a',
  paid: '#d1fae5'
}

function KanbanBoard({ tasks, onTaskUpdate, onTaskClick }) {
  const [draggedTask, setDraggedTask] = useState(null)

  const groupedTasks = STATUS_COLUMNS.reduce((acc, column) => {
    acc[column.id] = tasks.filter(task => task.status === column.id)
    return acc
  }, {})

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result

    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    const task = tasks.find(t => t.id.toString() === draggableId)
    if (!task) return

    const newStatus = destination.droppableId

    try {
      await axios.put(`${API_BASE_URL}/tasks/${task.id}`, {
        ...task,
        status: newStatus,
        sort_order: destination.index
      })
      onTaskUpdate()
    } catch (error) {
      console.error('Error updating task status:', error)
      alert('ステータスの更新に失敗しました')
    }
  }

  const handleInvoiceStatusChange = async (task, newInvoiceStatus) => {
    try {
      await axios.put(`${API_BASE_URL}/tasks/${task.id}`, {
        ...task,
        invoice_status: newInvoiceStatus
      })
      onTaskUpdate()
    } catch (error) {
      console.error('Error updating invoice status:', error)
      alert('請求ステータスの更新に失敗しました')
    }
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '15px',
        marginTop: '20px',
        overflowX: 'auto'
      }}>
        {STATUS_COLUMNS.map(column => (
          <div key={column.id} style={{ minWidth: '250px' }}>
            <div style={{
              backgroundColor: column.color,
              padding: '12px',
              borderRadius: '8px 8px 0 0',
              fontWeight: '600',
              textAlign: 'center',
              fontSize: '14px'
            }}>
              {column.label} ({groupedTasks[column.id].length})
            </div>

            <Droppable droppableId={column.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  style={{
                    backgroundColor: snapshot.isDraggingOver ? '#f0f0f0' : '#f9fafb',
                    padding: '10px',
                    minHeight: '500px',
                    borderRadius: '0 0 8px 8px',
                    border: '1px solid #e5e7eb'
                  }}
                >
                  {groupedTasks[column.id].map((task, index) => (
                    <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          onClick={() => onTaskClick(task)}
                          onMouseEnter={(e) => {
                            if (!snapshot.isDragging) {
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
                              e.currentTarget.style.transform = 'translateY(-2px)'
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!snapshot.isDragging) {
                              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'
                              e.currentTarget.style.transform = 'translateY(0)'
                            }
                          }}
                          style={{
                            ...provided.draggableProps.style,
                            backgroundColor: 'white',
                            padding: '12px',
                            marginBottom: '10px',
                            borderRadius: '6px',
                            boxShadow: snapshot.isDragging
                              ? '0 5px 15px rgba(0,0,0,0.3)'
                              : '0 1px 3px rgba(0,0,0,0.1)',
                            cursor: 'pointer',
                            transition: 'box-shadow 0.2s, transform 0.2s'
                          }}
                        >
                          <div style={{ fontWeight: '500', marginBottom: '8px', fontSize: '14px' }}>
                            {task.title}
                          </div>

                          {task.description && (
                            <div style={{
                              fontSize: '12px',
                              color: '#666',
                              marginBottom: '8px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {task.description}
                            </div>
                          )}

                          {task.amount > 0 && (
                            <div style={{ fontSize: '13px', fontWeight: '600', color: '#667eea', marginBottom: '8px' }}>
                              ¥{task.amount.toLocaleString()}
                            </div>
                          )}

                          {task.due_date && (
                            <div style={{ fontSize: '11px', color: '#888', marginBottom: '8px' }}>
                              期限: {task.due_date}
                            </div>
                          )}

                          <select
                            value={task.invoice_status || 'not_invoiced'}
                            onChange={(e) => {
                              e.stopPropagation()
                              handleInvoiceStatusChange(task, e.target.value)
                            }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              width: '100%',
                              padding: '4px 8px',
                              fontSize: '11px',
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              backgroundColor: INVOICE_STATUS_COLORS[task.invoice_status] || '#e5e7eb',
                              cursor: 'pointer'
                            }}
                          >
                            {Object.entries(INVOICE_STATUS_MAP).map(([value, label]) => (
                              <option key={value} value={value}>{label}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  )
}

export default KanbanBoard
