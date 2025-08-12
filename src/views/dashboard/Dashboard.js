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
} from '@coreui/react'
import SyncSuccessChart from 'src/components/SyncSuccessChart'
import axios from 'axios'
import { jwtDecode } from 'jwt-decode' // <-- Correct import

const Dashboard = () => {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)
  const [ftpSettings, setFtpSettings] = useState([])
  const [shopifySettings, setShopifySettings] = useState([])

  // Extract userId from JWT token
  const getUserIdFromToken = () => {
    const token = localStorage.getItem('token')
    if (!token) return null
    try {
      const decoded = jwtDecode(token) // <-- Correct usage
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
      .then((res) => setShopifySettings(res.data))
      .catch(() => setError('Failed to fetch Shopify settings'))
      .finally(() => setLoading(false))
  }, [userId])

  const handleSyncNow = async () => {
    setLoading(true)
    setMessage(null)
    setError(null)
    try {
      const response = await axios.post(
        'http://localhost:5000/api/sync-now',
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      )
      if (response.status === 200) {
        setMessage(response.data.message || 'Sync completed successfully')
      } else {
        setError(response.data.message || 'Sync failed')
      }
    } catch {
      setError('Error connecting to server')
    }
    setLoading(false)
  }

  return (
    <div>
      <CRow className="mb-3">
        <CCol>
          <CButton color="primary" onClick={handleSyncNow} disabled={loading}>
            {loading ? (
              <>
                <CSpinner size="sm" /> Syncing...
              </>
            ) : (
              'Sync Now'
            )}
          </CButton>
        </CCol>
      </CRow>

      {message && <CAlert color="success">{message}</CAlert>}
      {error && <CAlert color="danger">{error}</CAlert>}

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
                    </tr>
                  </thead>
                  <tbody>
                    {shopifySettings.map((shop) => (
                      <tr key={shop.id}>
                        <td>{shop.shop_name}</td>
                        <td>{shop.access_token || '-'}</td>
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
    </div>
  )
}

export default Dashboard
