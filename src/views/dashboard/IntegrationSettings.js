// views/dashboard/IntegrationSettings.js
import React, { useState } from 'react'
import { CForm, CFormInput, CButton } from '@coreui/react'

const IntegrationSettings = () => {
  const [ftpHost, setFtpHost] = useState('')
  const [ftpUser, setFtpUser] = useState('')
  const [ftpPassword, setFtpPassword] = useState('')
  const [shopifyDomain, setShopifyDomain] = useState('')
  const [shopifyToken, setShopifyToken] = useState('')
  const [message, setMessage] = useState('')

  const handleSave = async () => {
    const payload = {
      ftpHost: ftpHost,
      ftpUser: ftpUser,
      ftpPass: ftpPassword,
      shopifyShopName: shopifyDomain,
      shopifyToken: shopifyToken,
    }
    console.log('Sending payload:', payload)  // <-- debug here

    try {
      const res = await fetch('http://localhost:5000/save-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      console.log('Response from server:', data)  // <-- debug here
      setMessage(data.message || data.error)
    } catch (error) {
      console.error('Error saving credentials:', error)
      setMessage('Failed to save credentials')
    }
  }

  return (
    <CForm>
      <h4>FTP Credentials</h4>
      <CFormInput
        label="FTP Host"
        value={ftpHost}
        onChange={(e) => setFtpHost(e.target.value)}
        className="mb-3"
      />
      <CFormInput
        label="FTP Username"
        value={ftpUser}
        onChange={(e) => setFtpUser(e.target.value)}
        className="mb-3"
      />
      <CFormInput
        label="FTP Password"
        type="password"
        value={ftpPassword}
        onChange={(e) => setFtpPassword(e.target.value)}
        className="mb-3"
      />

      <h4 className="mt-4">Shopify Store</h4>
      <CFormInput
        label="Shopify Store Domain"
        placeholder="e.g., techguru2025"
        value={shopifyDomain}
        onChange={(e) => setShopifyDomain(e.target.value)}
        className="mb-3"
      />
      <CFormInput
        label="Shopify Access Token"
        type="password"
        value={shopifyToken}
        onChange={(e) => setShopifyToken(e.target.value)}
        className="mb-3"
      />

      <CButton className="mt-3" onClick={handleSave}>
        Save & Sync
      </CButton>

      {message && <p className="mt-3">{message}</p>}
    </CForm>
  )
}

export default IntegrationSettings
