import React, { useState } from 'react'
import {
  CAvatar,
  CDropdown,
  CDropdownDivider,
  CDropdownHeader,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
  CModal,
  CModalHeader,
  CModalBody,
  CModalTitle,
  CForm,
  CFormInput,
  CButton,
} from '@coreui/react'
import { cilSettings } from '@coreui/icons'
import CIcon from '@coreui/icons-react'

import avatar8 from './../../assets/images/avatars/8.jpg'

const AppHeaderDropdown = () => {
  const [visible, setVisible] = useState(false)

  // Credentials states
  const [ftpHost, setFtpHost] = useState('')
  const [ftpUser, setFtpUser] = useState('')
  const [ftpPass, setFtpPass] = useState('')
  const [shopifyShopName, setShopifyShopName] = useState('')
  const [shopifyToken, setShopifyToken] = useState('')

  const handleSave = async () => {
    const ftpData = {
      ftpHost,
      ftpUser,
      ftpPass,
    }

    try {
      // 1) Save FTP credentials and download CSV from FTP
      const ftpResponse = await fetch('http://127.0.0.1:5000/save-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ftpData),
      })

      const ftpResult = await ftpResponse.json()

      if (!ftpResponse.ok) {
        alert('FTP error: ' + (ftpResult.error || 'Unknown error'))
        return
      }

      const csvPath = ftpResult.csvPath
      console.log('CSV downloaded to:', csvPath)

      // 2) Call update inventory with CSV path + Shopify credentials
      const inventoryResponse = await fetch('http://127.0.0.1:5000/update-inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          csvPath,
          shopifyShopName,
          shopifyToken,
        }),
      })

      const inventoryResult = await inventoryResponse.json()

      if (!inventoryResponse.ok) {
        alert('Inventory update failed: ' + (inventoryResult.error || 'Unknown error'))
        return
      }

      alert('Inventory updated successfully!')
      console.log('Shopify Output:', inventoryResult.output)
    } catch (error) {
      alert('Network error: ' + error.message)
    }

    setVisible(false)
  }

  return (
    <>
      <CDropdown variant="nav-item">
        <CDropdownToggle placement="bottom-end" className="py-0 pe-0" caret={false}>
          <CAvatar src={avatar8} size="md" />
        </CDropdownToggle>
        <CDropdownMenu className="pt-0" placement="bottom-end">
          <CDropdownHeader className="bg-body-secondary fw-semibold my-2">Settings</CDropdownHeader>
          <CDropdownItem onClick={() => setVisible(true)}>
            <CIcon icon={cilSettings} className="me-2" />
            Settings
          </CDropdownItem>
        </CDropdownMenu>
      </CDropdown>

      {/* Modal for FTP & Shopify credentials */}
      <CModal visible={visible} onClose={() => setVisible(false)}>
        <CModalHeader>
          <CModalTitle>Enter Credentials</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm>
            <CFormInput
              label="FTP Host"
              placeholder="ftp.example.com"
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
              type="password"
              label="FTP Password"
              value={ftpPass}
              onChange={(e) => setFtpPass(e.target.value)}
              className="mb-3"
            />
            <CFormInput
              label="Shopify Shop Name"
              value={shopifyShopName}
              onChange={(e) => setShopifyShopName(e.target.value)}
              className="mb-4"
            />
            <CFormInput
              label="Shopify Token"
              value={shopifyToken}
              onChange={(e) => setShopifyToken(e.target.value)}
              className="mb-4"
            />
            <CButton color="primary" onClick={handleSave}>
              Save & Update Inventory
            </CButton>
          </CForm>
        </CModalBody>
      </CModal>
    </>
  )
}

export default AppHeaderDropdown
