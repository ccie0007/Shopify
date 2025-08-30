import React, { useEffect, useState } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CRow,
  CCol,
  CButton,
  CSpinner,
  CAlert,
  CModal,
  CModalHeader,
  CModalBody,
  CFormInput,
  CFormSelect,
} from '@coreui/react'
import axios from 'axios'
import { jwtDecode } from 'jwt-decode'
import ImportActionsTable from './ImportActionsTable'
import Confetti from 'react-confetti'
import { useWindowSize } from '@react-hook/window-size'
import 'src/scss/style.scss';

const Dashboard = () => {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)
  const [revealedTokens, setRevealedTokens] = useState({})
  const [showModal, setShowModal] = useState(false)
  const [modalShop, setModalShop] = useState(null)
  const [password, setPassword] = useState('')
  const [modalError, setModalError] = useState(null)
  const [modalLoading, setModalLoading] = useState(false)
  const [importActions, setImportActions] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [newActionType, setNewActionType] = useState('update_skus')
  const [showConfetti, setShowConfetti] = useState(false)
  const [width, height] = useWindowSize()
  const [status, setStatus] = useState('idle'); // 'idle' | 'processing' | 'success' | 'error'

  // Extract userId from JWT token
  const getUserIdFromToken = () => {
    const token = localStorage.getItem('token')
    if (!token) return null
    try {
      const decoded = jwtDecode(token)
      return decoded.userId
    } catch {
      return null
    }
  }

  const userId = getUserIdFromToken()

  useEffect(() => {
    if (!userId) {
      setError('User not authenticated')
      return
    }

    setLoading(true)
    setError(null)

    // Fetch import actions
    axios
      .get(`http://localhost:5000/api/import-actions`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      .then((res) => setImportActions(res.data))
      .catch(() => setError('Failed to fetch import actions'))
      .finally(() => setLoading(false))
  }, [userId, message])

  useEffect(() => {
    if (message || error) {
      const timer = setTimeout(() => {
        setMessage(null)
        setError(null)
      }, 4000) // 4 seconds
      return () => clearTimeout(timer)
    }
  }, [message, error])

  const handleSyncNow = async () => {
    setLoading(true)
    setMessage(null)
    setError(null)
    try {
      const res = await fetch('http://127.0.0.1:5000/api/sync-now', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + localStorage.getItem('token'),
        },
      })
      const data = await res.json()
      if (res.ok) {
        setMessage(data.message || 'Sync completed')
        setError(null)
      } else {
        setError(data.message || data.error || 'Sync failed')
        setMessage(null)
      }
    } catch (err) {
      setError('Error connecting to server')
      setMessage(null)
    } finally {
      setLoading(false)
    }
  }

  // Import Actions Table handlers
  const openEdit = (action) => {
    alert('Edit action: ' + action.name)
  }

  const runNow = async (action) => {
    setMessage(null)
    setError(null)
    try {
      let res, data
      if (
        action.name === 'Create New Products' ||
        action.name === 'Create Orders' ||
        action.name === 'Update SKUs' ||
        action.name === 'Update Tracking' // <-- Add this line
      ) {
        // Open file picker
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.csv'
        input.onchange = async (e) => {
          const file = e.target.files[0]
          if (!file) {
            return
          }
          setLoading(true)
          setStatus && setStatus('processing');
          const formData = new FormData()
          formData.append('file', file)
          let endpoint = ''
          if (action.name === 'Create New Products') endpoint = 'import-products'
          else if (action.name === 'Create Orders') endpoint = 'import-orders'
          else if (action.name === 'Update SKUs') endpoint = 'import-skus'
          else if (action.name === 'Update Tracking') endpoint = 'import-tracking' // <-- Add this line
          res = await fetch(`http://127.0.0.1:5000/api/${endpoint}`, {
            method: 'POST',
            headers: {
              Authorization: 'Bearer ' + localStorage.getItem('token'),
            },
            body: formData,
          })
          data = await res.json()
          if (res.ok) {
            setMessage(data.message || `${action.name} completed!`)
            setShowConfetti(true)
            setTimeout(() => setShowConfetti(false), 3000)
          } else {
            setError(data.error || `${action.name} failed`)
          }
          setLoading(false)
          setStatus && setStatus('idle');
        }
        input.click()
        return // Don't continue, wait for file picker
      } else {
        // Default: Update SKUs (sync-now)
        res = await fetch('http://127.0.0.1:5000/api/sync-now', {
          method: 'POST',
          headers: {
            Authorization: 'Bearer ' + localStorage.getItem('token'),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ actionId: action.id }),
        })
        data = await res.json()
        if (res.ok) {
          setMessage(data.message || 'Update SKUs completed!')
          setShowConfetti(true)
          setTimeout(() => setShowConfetti(false), 3000)
        } else {
          setError(data.message || data.error || 'Sync failed')
        }
      }
    } catch (err) {
      setError('Error connecting to server')
      setMessage(null)
      setLoading(false)
      setStatus && setStatus('idle');
    }
  }

  const duplicateAction = (action) => {
    alert('Duplicate action: ' + action.name)
  }

  const deleteAction = async (actionId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/import-actions/${actionId}`, {
        method: 'DELETE',
        headers: {
          Authorization: 'Bearer ' + localStorage.getItem('token'),
        },
      })
      if (res.ok) {
        setImportActions(importActions.filter(a => a.id !== actionId))
      } else {
        alert('Failed to delete import action')
      }
    } catch (err) {
      alert('Failed to delete import action')
    }
  }

  const handleCreateAction = async () => {
    try {
      // Map the selected value to display name and type
      const actionMap = {
        update_skus: { name: 'Update SKUs', type: 'Products API' },
        create_orders: { name: 'Create Orders', type: 'Orders API' },
        update_tracking: { name: 'Update Tracking', type: 'Fulfillment API' },
        create_products: { name: 'Create New Products', type: 'Products API' },
      }
      const selected = actionMap[newActionType]

      // Call backend to create the new action
      const res = await fetch('http://localhost:5000/api/import-actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + localStorage.getItem('token'),
        },
        body: JSON.stringify({
          name: selected.name,
          type: selected.type,
        }),
      })

      if (res.ok) {
        setShowAddModal(false)
        setNewActionType('update_skus')
        // setMessage('Import action created!') // <-- Remove or comment out this line
        // Refresh the list
        const updated = await fetch('http://localhost:5000/api/import-actions', {
          headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
        })
        setImportActions(await updated.json())
      } else {
        const data = await res.json()
        setMessage(data.error || 'Failed to create import action')
      }
    } catch (err) {
      setMessage('Failed to create import action')
    }
  }

  const allActions = [
    { value: 'update_skus', label: 'Update SKUs', type: 'Products API' },
    { value: 'create_orders', label: 'Create Orders', type: 'Orders API' },
    { value: 'update_tracking', label: 'Update Tracking', type: 'Fulfillment API' },
    { value: 'create_products', label: 'Create New Products', type: 'Products API' },
  ]

  // Compute which actions are still available
  const usedValues = importActions.map(a => {
    const found = allActions.find(x => x.label === a.name)
    return found ? found.value : null
  }).filter(Boolean)
  const availableActions = allActions.filter(a => !usedValues.includes(a.value))

  const handleAddNewImportAction = () => {
    setNewActionType(availableActions[0]?.value || 'update_skus')
    setShowAddModal(true)
  }

  const handleFileUpload = async (file) => {
    // 1. Upload file to backend
    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + localStorage.getItem('token'),
      },
      body: formData,
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Failed to upload file')
      return
    }

    setMessage('File uploaded successfully')
    // 2. Show "Import" button
  }

  const handleImportClick = async () => {
    // 3. Tell backend to process the uploaded file
    const res = await fetch('/api/import-products', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + localStorage.getItem('token'),
      },
    })

    const data = await res.json()
    if (res.ok) {
      setMessage('Import started successfully')
    } else {
      setError(data.error || 'Failed to start import')
    }
  }

  const handleImport = async () => {
    setStatus('processing');
    try {
      const res = await fetch('/api/import-skus', { /* ... */ });
      if (res.ok) {
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <div>
      {/* Import Actions Table */}
      <CRow>
        <CCol>
          <CCard className="mb-4">
            <CCardHeader>Import Actions</CCardHeader>
            <CCardBody>
              {/* Add New Action button and message area */}
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16, gap: 16 }}>
                <CButton color="primary" onClick={handleAddNewImportAction}>
                  Add New Import Action
                </CButton>
                {/* Show spinner while loading */}
                {loading && (
                  <CSpinner color="primary" style={{ marginRight: 12, verticalAlign: 'middle' }} />
                )}
                {(message || error) && (
                  <div style={{ display: 'inline-block' }}>
                    {message && (
                      <CAlert color="success" className="mb-0 py-2 px-3" style={{ display: 'inline-block', marginBottom: 0 }}>
                        {message}
                      </CAlert>
                    )}
                    {error && (
                      <CAlert color="danger" className="mb-0 py-2 px-3" style={{ display: 'inline-block', marginBottom: 0 }}>
                        {error}
                      </CAlert>
                    )}
                  </div>
                )}
              </div>

              {/* Import Actions Table */}
              <ImportActionsTable
                actions={importActions}
                openEdit={openEdit}
                runNow={runNow}
                duplicateAction={duplicateAction}
                deleteAction={deleteAction}
              />

              {/* Status/Progress indication */}
              {/* Sand bar removed */}
              {status === 'success' && (
                <div className="progress-bar success">
                  <span style={{ color: 'green', fontWeight: 'bold' }}>✔</span> {/* Green tick icon */}
                  <span>Completed!</span>
                </div>
              )}
              {status === 'error' && (
                <div className="progress-bar error">
                  <span style={{ color: 'red', fontWeight: 'bold' }}>✖</span>
                  <span>Error!</span>
                </div>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Add New Import Action Modal */}
      <CModal visible={showAddModal} onClose={() => setShowAddModal(false)}>
        <CModalHeader>Add New Import Action</CModalHeader>
        <CModalBody>
          {availableActions.length === 0 ? (
            <div style={{ color: '#888', marginBottom: 16 }}>
              All actions have been selected.
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontWeight: 500, marginBottom: 8, display: 'block' }}>Select Action Type:</label>
                <CFormSelect
                  value={newActionType}
                  onChange={e => setNewActionType(e.target.value)}
                >
                  {availableActions.map(a => (
                    <option key={a.value} value={a.value}>{a.label}</option>
                  ))}
                </CFormSelect>
              </div>
              <CButton color="primary" onClick={handleCreateAction}>
                Create Action
              </CButton>
            </>
          )}
        </CModalBody>
      </CModal>

      {/* Download link for Update SKUs CSV Template */}
      <div style={{ marginTop: 32 }}>
        <a href="/templates/update_skus_template.csv" download>
          Download Update SKUs CSV Template
        </a>
      </div>

      {/* Confetti explosion on successful action (e.g., after creating an import action) */}
      {showConfetti && <Confetti width={width} height={height} />}
    </div>
  )
}

export default Dashboard