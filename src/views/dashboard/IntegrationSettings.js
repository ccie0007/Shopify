// views/dashboard/IntegrationSettings.js
import React, { useState } from 'react'
import { CForm, CFormInput, CButton } from '@coreui/react'

const IntegrationSettings = () => {
  const [ftpHost, setFtpHost] = useState('')
  const [ftpUser, setFtpUser] = useState('')
  const [ftpPassword, setFtpPassword] = useState('')
  const [shopifyApiKey, setShopifyApiKey] = useState('')
  const [shopifyPassword, setShopifyPassword] = useState('')
  const [shopifyDomain, setShopifyDomain] = useState('')
  const [message, setMessage] = useState('')

  const handleSave = async () => {
    const res = await fetch('http://localhost:4000/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ftp: { host: ftpHost, user: ftpUser, password: ftpPassword },
        shopify: { apiKey: shopifyApiKey, password: shopifyPassword, domain: shopifyDomain },
      }),
    })

    const data = await res.json()
    setMessage(data.message)
  }

  return (
    <CForm>
      <h4>FTP Credentials</h4>
      <CFormInput label="Host" value={ftpHost} onChange={(e) => setFtpHost(e.target.value)} />
      <CFormInput label="Username" value={ftpUser} onChange={(e) => setFtpUser(e.target.value)} />
      <CFormInput
        label="Password"
        type="password"
        value={ftpPassword}
        onChange={(e) => setFtpPassword(e.target.value)}
      />

      <h4 className="mt-4">Shopify API</h4>
      <CFormInput
        label="API Key"
        value={shopifyApiKey}
        onChange={(e) => setShopifyApiKey(e.target.value)}
      />
      <CFormInput
        label="Password"
        type="password"
        value={shopifyPassword}
        onChange={(e) => setShopifyPassword(e.target.value)}
      />
      <CFormInput
        label="Store Domain"
        value={shopifyDomain}
        onChange={(e) => setShopifyDomain(e.target.value)}
      />

      <CButton className="mt-3" onClick={handleSave}>
        Sync Now
      </CButton>

      {message && <p className="mt-3">{message}</p>}
    </CForm>
  )
}

export default IntegrationSettings
