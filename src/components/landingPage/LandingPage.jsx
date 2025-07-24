import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CContainer, 
  CRow, 
  CCol, 
  CButton, 
  CCard, 
  CCardBody, 
  CCardTitle, 
  CCardText, 
  CCardImage
} from '@coreui/react';
import { cilUser, cilSpeedometer, cilLayers, cilMobile, cilChart, cilSpreadsheet, cilList } from '@coreui/icons';
import CIcon from '@coreui/icons-react';
import '@coreui/coreui/dist/css/coreui.min.css';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <div className="landing-page">
      {/* Login Button */}
      <div className="top-right-login">
        <CButton color="light" onClick={handleLogin} className="login-btn">
          <CIcon icon={cilUser} className="me-2" />
          Login
        </CButton>
      </div>

      {/* Hero Section */}
      <section className="hero-section">
        {/* ... your existing hero section ... */}
      </section>

      {/* Features Section */}
      <section className="features-section">
        <CContainer>
          <h2 className="section-title text-center mb-5">Why Choose CoreUI React?</h2>
          <CRow>
            <CCol md={4} className="mb-4">
              <CCard className="h-100 feature-card">
                <CCardBody className="text-center">
                  <div className="feature-icon mb-3">
                    <CIcon icon={cilSpeedometer} size="xl" />
                  </div>
                  <CCardTitle>Performance Optimized</CCardTitle>
                  <CCardText>
                    Built with React hooks for maximum performance.
                  </CCardText>
                </CCardBody>
              </CCard>
            </CCol>
            <CCol md={4} className="mb-4">
              <CCard className="h-100 feature-card">
                <CCardBody className="text-center">
                  <div className="feature-icon mb-3">
                    <CIcon icon={cilLayers} size="xl" />
                  </div>
                  <CCardTitle>100+ Components</CCardTitle>
                  <CCardText>
                    Ready-to-use components for any dashboard needs.
                  </CCardText>
                </CCardBody>
              </CCard>
            </CCol>
            <CCol md={4} className="mb-4">
              <CCard className="h-100 feature-card">
                <CCardBody className="text-center">
                  <div className="feature-icon mb-3">
                    <CIcon icon={cilMobile} size="xl" />
                  </div>
                  <CCardTitle>Fully Responsive</CCardTitle>
                  <CCardText>
                    Works on all devices from mobile to desktop.
                  </CCardText>
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>
        </CContainer>
      </section>

      {/* Components Section */}
      <section className="components-section">
        <CContainer>
          <h2 className="section-title text-center mb-5">Featured Components</h2>
          <CRow>
            <CCol md={3} className="mb-4">
              <CCard className="h-100 component-card">
                <CCardBody className="text-center">
                  <div className="feature-icon mb-3">
                    <CIcon icon={cilChart} size="xl" />
                  </div>
                  <CCardTitle>Charts</CCardTitle>
                  <CCardText>
                    Beautiful data visualization components.
                  </CCardText>
                </CCardBody>
              </CCard>
            </CCol>
            <CCol md={3} className="mb-4">
              <CCard className="h-100 component-card">
                <CCardBody className="text-center">
                  <div className="feature-icon mb-3">
                    <CIcon icon={cilSpreadsheet} size="xl" />
                  </div>
                  <CCardTitle>Data Tables</CCardTitle>
                  <CCardText>
                    Advanced tables with sorting and pagination.
                  </CCardText>
                </CCardBody>
              </CCard>
            </CCol>
            <CCol md={3} className="mb-4">
              <CCard className="h-100 component-card">
                <CCardBody className="text-center">
                  <div className="feature-icon mb-3">
                    <CIcon icon={cilList} size="xl" />
                  </div>
                  <CCardTitle>Lists</CCardTitle>
                  <CCardText>
                    Flexible list components for data display.
                  </CCardText>
                </CCardBody>
              </CCard>
            </CCol>
            {/* Add more component cards as needed */}
          </CRow>
        </CContainer>
      </section>

      {/* Other sections (Demo, CTA, Footer) */}
      {/* ... */}
    </div>
  );
};

export default LandingPage;