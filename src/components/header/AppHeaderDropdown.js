import React, { useState } from 'react'
import {
  CAvatar,
  CBadge,
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
import {
  cilBell,
  cilCreditCard,
  cilCommentSquare,
  cilEnvelopeOpen,
  cilFile,
  cilLockLocked,
  cilSettings,
  cilTask,
  cilUser,
} from '@coreui/icons'
import CIcon from '@coreui/icons-react'

import avatar8 from './../../assets/images/avatars/8.jpg'

const AppHeaderDropdown = () => {
  const [visible, setVisible] = useState(false)

  // State for credentials
  const [ftpHost, setFtpHost] = useState('')
  const [ftpUser, setFtpUser] = useState('')
  const [ftpPass, setFtpPass] = useState('')
  const [shopifyToken, setShopifyToken] = useState('')

  const handleSave = () => {
    console.log('Saved Credentials:', { ftpHost, ftpUser, ftpPass, shopifyToken })
    // TODO: Send this data to your backend API
    setVisible(false)
  }

  return (
    <>
      <CDropdown variant="nav-item">
        <CDropdownToggle placement="bottom-end" className="py-0 pe-0" caret={false}>
          <CAvatar src={avatar8} size="md" />
        </CDropdownToggle>
        <CDropdownMenu className="pt-0" placement="bottom-end">
          <CDropdownHeader className="bg-body-secondary fw-semibold mb-2">Account</CDropdownHeader>
          <CDropdownItem href="#">
            <CIcon icon={cilBell} className="me-2" />
            Updates
            <CBadge color="info" className="ms-2">42</CBadge>
          </CDropdownItem>
          <CDropdownItem href="#">
            <CIcon icon={cilEnvelopeOpen} className="me-2" />
            Messages
            <CBadge color="success" className="ms-2">42</CBadge>
          </CDropdownItem>
          <CDropdownItem href="#">
            <CIcon icon={cilTask} className="me-2" />
            Tasks
            <CBadge color="danger" className="ms-2">42</CBadge>
          </CDropdownItem>
          <CDropdownItem href="#">
            <CIcon icon={cilCommentSquare} className="me-2" />
            Comments
            <CBadge color="warning" className="ms-2">42</CBadge>
          </CDropdownItem>
          
          <CDropdownHeader className="bg-body-secondary fw-semibold my-2">Settings</CDropdownHeader>
          <CDropdownItem href="#">
            <CIcon icon={cilUser} className="me-2" />
            Profile
          </CDropdownItem>
          {/* SETTINGS ITEM OPENS MODAL */}
          <CDropdownItem onClick={() => setVisible(true)}>
            <CIcon icon={cilSettings} className="me-2" />
            Settings
          </CDropdownItem>
          <CDropdownItem href="#">
            <CIcon icon={cilCreditCard} className="me-2" />
            Payments
            <CBadge color="secondary" className="ms-2">42</CBadge>
          </CDropdownItem>
          <CDropdownItem href="#">
            <CIcon icon={cilFile} className="me-2" />
            Projects
            <CBadge color="primary" className="ms-2">42</CBadge>
          </CDropdownItem>
          <CDropdownDivider />
          <CDropdownItem href="#">
            <CIcon icon={cilLockLocked} className="me-2" />
            Lock Account
          </CDropdownItem>
        </CDropdownMenu>
      </CDropdown>

      {/* MODAL FOR CREDENTIALS */}
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
              label="Shopify Token"
              value={shopifyToken}
              onChange={(e) => setShopifyToken(e.target.value)}
              className="mb-4"
            />
            <CButton color="primary" onClick={handleSave}>
              Save
            </CButton>
          </CForm>
        </CModalBody>
      </CModal>
    </>
  )
}

export default AppHeaderDropdown
