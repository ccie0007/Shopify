import React, { useState, useEffect } from 'react'
import {
  CButton,
  CModal,
  CModalBody,
  CModalHeader,
  CFormInput,
  CSpinner,
  CTable,
  CTableHead,
  CTableBody,
  CTableRow,
  CTableHeaderCell,
  CTableDataCell,
  CForm,
  CRow,
  CCol,
  CAlert,
} from '@coreui/react'

const BACKEND_URL = 'http://localhost:5000'

const ShopifySettingsTable = () => {
  const [jwtToken] = useState(localStorage.getItem('token') || null)
  const [shopifySettings, setShopifySettings] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [modalShop, setModalShop] = useState(null)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [revealedTokens, setRevealedTokens] = useState({})
  const [error, setError] = useState(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const [addShopName, setAddShopName] = useState('')
  const [addAccessToken, setAddAccessToken] = useState('')
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState(null)
  const [addSuccess, setAddSuccess] = useState(null)

  // Fetch all Shopify settings for the user
  useEffect(() => {
    if (!jwtToken) {
      setError('Please login first')
      setInitialLoading(false)
      return
    }
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/shopify-settings`, {
          headers: { Authorization: `Bearer ${jwtToken}` },
        })
        if (!res.ok) throw new Error('Failed to fetch Shopify settings')
        const data = await res.json()
        // Mask tokens for display
        const masked = data.map(shop => ({
          ...shop,
          maskedToken: shop.access_token.length > 8
            ? shop.access_token.slice(0, 4) + '*'.repeat(shop.access_token.length - 8) + shop.access_token.slice(-4)
            : '*'.repeat(shop.access_token.length)
        }))
        setShopifySettings(masked)
      } catch (err) {
        setError(err.message)
      } finally {
        setInitialLoading(false)
      }
    }
    fetchSettings()
  }, [jwtToken, addSuccess])

  // Add new Shopify setting
  const handleAddShopifySetting = async (e) => {
    e.preventDefault()
    setAddError(null)
    setAddSuccess(null)
    setAddLoading(true)
    try {
      const res = await fetch(`${BACKEND_URL}/api/shopify-settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwtToken}`,
        },
        body: JSON.stringify({
          shop_name: addShopName,
          access_token: addAccessToken,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setAddError(data.message || 'Failed to add Shopify setting')
        setAddLoading(false)
        return
      }
      setAddSuccess('Shopify setting added!')
      setAddShopName('')
      setAddAccessToken('')
    } catch (err) {
      setAddError('Error adding Shopify setting')
    } finally {
      setAddLoading(false)
    }
  }

  // Reveal full token for a shop
  const submitPassword = async () => {
    if (!modalShop) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${BACKEND_URL}/api/shopify-token/${modalShop.shop_name}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwtToken}`,
        },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to reveal token')
        setLoading(false)
        return
      }
      setRevealedTokens(prev => ({
        ...prev,
        [modalShop.id]: data.fullToken
      }))
      setShowModal(false)
      setPassword('')
    } catch (err) {
      setError('Error revealing token')
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) return <div>Loading shop info...</div>
  if (error && !showModal) return <div style={{ color: 'red' }}>Error: {error}</div>

  return (
    <>
      {/* Add Shopify Setting Form */}
      <CForm onSubmit={handleAddShopifySetting} className="mb-4">
        <CRow>
          <CCol md={5}>
            <CFormInput
              label="Shop Name"
              placeholder="Enter shop name"
              value={addShopName}
              onChange={e => setAddShopName(e.target.value)}
              required
            />
          </CCol>
          <CCol md={5}>
            <CFormInput
              label="Access Token"
              placeholder="Enter access token"
              value={addAccessToken}
              onChange={e => setAddAccessToken(e.target.value)}
              required
            />
          </CCol>
          <CCol md={2} className="d-flex align-items-end">
            <CButton color="primary" type="submit" disabled={addLoading}>
              {addLoading ? 'Adding...' : 'Add'}
            </CButton>
          </CCol>
        </CRow>
        {addError && <CAlert color="danger" className="mt-2">{addError}</CAlert>}
        {addSuccess && <CAlert color="success" className="mt-2">{addSuccess}</CAlert>}
      </CForm>

      {/* Shopify Settings Table */}
      <CTable striped hover>
        <CTableHead>
          <CTableRow>
            <CTableHeaderCell>Shop Name</CTableHeaderCell>
            <CTableHeaderCell>Access Token</CTableHeaderCell>
            <CTableHeaderCell>Actions</CTableHeaderCell>
          </CTableRow>
        </CTableHead>
        <CTableBody>
          {shopifySettings.map(shop => (
            <CTableRow key={shop.id}>
              <CTableDataCell>{shop.shop_name}</CTableDataCell>
              <CTableDataCell style={{ fontFamily: 'monospace' }}>
                {revealedTokens[shop.id] || shop.maskedToken || '—'}
              </CTableDataCell>
              <CTableDataCell>
                {!revealedTokens[shop.id] && (
                  <CButton
                    color="primary"
                    size="sm"
                    onClick={() => {
                      setModalShop(shop)
                      setShowModal(true)
                      setError(null)
                    }}
                  >
                    Reveal
                  </CButton>
                )}
              </CTableDataCell>
            </CTableRow>
          ))}
        </CTableBody>
      </CTable>

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
          {error && <div style={{ color: 'red', marginTop: '0.5rem' }}>{error}</div>}
          <div style={{ marginTop: '1rem' }}>
            <CButton color="primary" onClick={submitPassword} disabled={loading}>
              {loading ? <CSpinner size="sm" /> : 'Confirm'}
            </CButton>
          </div>
        </CModalBody>
      </CModal>
    </>
  )
}

export default ShopifySettingsTable
