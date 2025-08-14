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
} from '@coreui/react'
import SyncSuccessChart from 'src/components/SyncSuccessChart'
import axios from 'axios'
import { jwtDecode } from 'jwt-decode'

const Dashboard = () => {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)
  const [ftpSettings, setFtpSettings] = useState([])
  const [shopifySettings, setShopifySettings] = useState([])
  const [revealedTokens, setRevealedTokens] = useState({})
  const [showModal, setShowModal] = useState(false)
  const [modalShop, setModalShop] = useState(null)
  const [password, setPassword] = useState('')
  const [modalError, setModalError] = useState(null)
  const [modalLoading, setModalLoading] = useState(false)

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

    // Fetch FTP settings
    axios
      .get(`http://localhost:5000/api/ftp-connections`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      .then((res) => setFtpSettings(res.data))
      .catch(() => setError('Failed to fetch FTP settings'))

    // Fetch Shopify settings
    axios
      .get(`http://localhost:5000/api/shopify-settings`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      .then((res) => {
        // Mask tokens for display
        const masked = res.data.map((shop) => ({
          ...shop,
          maskedToken:
            shop.access_token && shop.access_token.length > 8
              ? shop.access_token.slice(0, 4) +
                '*'.repeat(shop.access_token.length - 8) +
                shop.access_token.slice(-4)
              : '*'.repeat((shop.access_token || '').length),
        }))
        setShopifySettings(masked)
      })
      .catch(() => setError('Failed to fetch Shopify settings'))
      .finally(() => setLoading(false))
  }, [userId, message])

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

  // Reveal full token for a shop
  const handleReveal = (shop) => {
    setModalShop(shop)
    setShowModal(true)
    setPassword('')
    setModalError(null)
  }

  const submitPassword = async () => {
    if (!modalShop) return
    setModalLoading(true)
    setModalError(null)
    try {
      const res = await axios.post(
        `http://localhost:5000/api/shopify-token/${modalShop.shop_name}`,
        { password },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      )
      if (res.data.fullToken) {
        setRevealedTokens((prev) => ({
          ...prev,
          [modalShop.id]: res.data.fullToken,
        }))
        setShowModal(false)
        setPassword('')
      } else {
        setModalError('Failed to reveal token')
      }
    } catch (err) {
      setModalError(
        err.response?.data?.error || 'Incorrect password or server error'
      )
    } finally {
      setModalLoading(false)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <CButton color="success" onClick={handleSyncNow} disabled={loading}>
          {loading ? <CSpinner size="sm" /> : 'Sync Now'}
        </CButton>
        {message && (
          <span>
            <CAlert color="success" className="mb-0 py-2 px-3" style={{ display: 'inline-block', minWidth: 180, maxWidth: 320, padding: '0.25rem 0.75rem' }}>
              {message}
            </CAlert>
          </span>
        )}
        {error && (
          <span>
            <CAlert color="danger" className="mb-0 py-2 px-3" style={{ display: 'inline-block', minWidth: 180, maxWidth: 320, padding: '0.25rem 0.75rem' }}>
              {error}
            </CAlert>
          </span>
        )}
      </div>

      <CRow>
        <CCol sm={6} lg={3}>
          <CCard className="mb-4">
            <CCardHeader>Total FTP Connections</CCardHeader>
            <CCardBody>{ftpSettings.length}</CCardBody>
          </CCard>
        </CCol>
        <CCol sm={6} lg={3}>
          <CCard className="mb-4">
            <CCardHeader>Active Shopify Stores</CCardHeader>
            <CCardBody>{shopifySettings.length}</CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CRow>
        <CCol lg={8}>
          <CCard className="mb-4">
            <CCardHeader>FTP Sync Success Overview</CCardHeader>
            <CCardBody>
              <SyncSuccessChart />
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* FTP Settings Table */}
      <CRow>
        <CCol>
          <CCard className="mb-4">
            <CCardHeader>FTP Settings</CCardHeader>
            <CCardBody>
              {ftpSettings.length > 0 ? (
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Host</th>
                      <th>Username</th>
                      <th>Port</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ftpSettings.map((ftp) => (
                      <tr key={ftp.id}>
                        <td>{ftp.name}</td>
                        <td>{ftp.host}</td>
                        <td>{ftp.username}</td>
                        <td>{ftp.port}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No FTP settings found</p>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Shopify Settings Table */}
      <CRow>
        <CCol>
          <CCard className="mb-4">
            <CCardHeader>Shopify Settings</CCardHeader>
            <CCardBody>
              {shopifySettings.length > 0 ? (
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>Shop Name</th>
                      <th>Access Token</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shopifySettings.map((shop) => (
                      <tr key={shop.id}>
                        <td>{shop.shop_name}</td>
                        <td style={{ fontFamily: 'monospace' }}>
                          {revealedTokens[shop.id] || shop.maskedToken || '-'}
                        </td>
                        <td>
                          {!revealedTokens[shop.id] && (
                            <CButton
                              color="primary"
                              size="sm"
                              onClick={() => handleReveal(shop)}
                            >
                              Reveal
                            </CButton>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No Shopify settings found</p>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Reveal Modal */}
      <CModal visible={showModal} onClose={() => setShowModal(false)}>
        <CModalHeader>Re-enter Password</CModalHeader>
        <CModalBody>
          <CFormInput
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {modalError && (
            <div style={{ color: 'red', marginTop: '0.5rem' }}>{modalError}</div>
          )}
          <div style={{ marginTop: '1rem' }}>
            <CButton
              color="primary"
              onClick={submitPassword}
              disabled={modalLoading}
            >
              {modalLoading ? <CSpinner size="sm" /> : 'Confirm'}
            </CButton>
          </div>
        </CModalBody>
      </CModal>
    </div>
  )
}

export default Dashboard
