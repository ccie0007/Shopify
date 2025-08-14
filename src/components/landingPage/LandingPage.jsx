import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CContainer,
  CRow,
  CCol,
  CButton,
  CCard,
  CCardBody,
  CCardTitle,
  CCardText,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSettings, cilCloudDownload, cilChart, cilLockLocked } from '@coreui/icons'

const features = [
  {
    icon: cilCloudDownload,
    title: 'Real-time FTP Sync',
    desc: 'Sync your inventory and orders instantly between Shopify and your FTP server.',
  },
  {
    icon: cilSettings,
    title: 'Effortless Integration',
    desc: 'Connect, configure, and manage all your stores and FTP connections in one place.',
  },
  {
    icon: cilChart,
    title: 'Live Insights',
    desc: 'Monitor sync status, view analytics, and get actionable insights at a glance.',
  },
  {
    icon: cilLockLocked,
    title: 'Secure & Reliable',
    desc: 'Your data is encrypted and protected with enterprise-grade security.',
  },
]

const LandingPage = () => {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh', background: '#f8f8f9', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navigation */}
      <nav style={{
        background: '#fff',
        borderBottom: '1px solid #e5e6e8',
        padding: '1rem 0',
        marginBottom: '2rem',
        boxShadow: '0 2px 8px 0 rgba(0,0,0,0.01)'
      }}>
        <CContainer>
          <CRow className="align-items-center">
            <CCol xs="auto">
              <span style={{ fontWeight: 700, fontSize: 22, color: '#222' }}>Shopify FTP Dashboard</span>
            </CCol>
            <CCol className="d-none d-md-flex justify-content-end" style={{ gap: '1.5rem' }}>
              <a href="#/pricing" style={{ color: '#222', textDecoration: 'none', fontWeight: 500 }}>Pricing</a>
              <a href="#/enterprise" style={{ color: '#222', textDecoration: 'none', fontWeight: 500 }}>Enterprise</a>
              <a href="#/careers" style={{ color: '#222', textDecoration: 'none', fontWeight: 500 }}>Careers</a>
              <a href="#/help" style={{ color: '#222', textDecoration: 'none', fontWeight: 500 }}>Help Center</a>
              <CButton color="success" style={{ marginLeft: 16 }} onClick={() => navigate('/login')}>
                Get Started for Free
              </CButton>
            </CCol>
          </CRow>
        </CContainer>
      </nav>

      {/* Hero Section */}
      <CContainer className="flex-grow-1 d-flex align-items-center">
        <CRow className="justify-content-center w-100">
          <CCol md={8} lg={7} className="text-center">
            <h1 style={{ fontWeight: 700, fontSize: '2.5rem', color: '#222', marginBottom: '1.5rem' }}>
              It’s like having a Shopify expert in your team.
            </h1>
            <p style={{ color: '#555', fontSize: '1.25rem', marginBottom: '2.5rem' }}>
              Shopify FTP Dashboard gives you real-time sync, live insights, and secure management for all your Shopify and FTP integrations—without the hassle.
            </p>
            <CButton color="success" size="lg" style={{ fontWeight: 600, padding: '0.75rem 2.5rem', fontSize: '1.15rem' }} onClick={() => navigate('/login')}>
              Get Started for Free
            </CButton>
            <div style={{ marginTop: '2.5rem', color: '#888', fontSize: '1rem' }}>
              <span>Scroll down to see it in action ↓</span>
            </div>
          </CCol>
        </CRow>
      </CContainer>

      {/* Features Section */}
      <CContainer style={{ marginTop: '3rem', marginBottom: '3rem' }}>
        <CRow className="g-4">
          {features.map((f, idx) => (
            <CCol xs={12} md={6} lg={3} key={idx}>
              <CCard className="h-100 shadow-sm" style={{ border: 'none', background: '#fff' }}>
                <CCardBody className="text-center">
                  <CIcon icon={f.icon} size="xxl" style={{ color: '#198754', marginBottom: 16 }} />
                  <CCardTitle style={{ fontWeight: 600, color: '#222', marginBottom: 8 }}>{f.title}</CCardTitle>
                  <CCardText style={{ color: '#555', fontSize: '1rem' }}>{f.desc}</CCardText>
                </CCardBody>
              </CCard>
            </CCol>
          ))}
        </CRow>
      </CContainer>

      {/* Footer */}
      <footer style={{ background: '#fff', borderTop: '1px solid #e5e6e8', padding: '1.5rem 0', textAlign: 'center', color: '#888', fontSize: '1rem' }}>
        © {new Date().getFullYear()} Shopify FTP Dashboard. All rights reserved.
      </footer>
    </div>
  )
}

export default LandingPage