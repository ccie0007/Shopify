import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode'; // Correct import syntax

import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CTable,
  CTableBody,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableDataCell,
  CButton,
  CForm,
  CFormInput,
  CFormLabel,
} from '@coreui/react';

const FtpConnections = () => {
  const [ftpConnections, setFtpConnections] = useState([]);
  const [newFtp, setNewFtp] = useState({
    name: '',
    host: '',
    username: '',
    password: '',
    port: 21,
  });
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Extract userId from token on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('No authentication token found');
      return;
    }

    try {
      const decoded = jwtDecode(token); // Proper usage of jwt_decode
      setUserId(decoded.userId);
    } catch (error) {
      console.error('Invalid token:', error);
      setError('Invalid authentication token');
    }
  }, []);

  // Load FTP connections when userId changes
  useEffect(() => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);
    
    const token = localStorage.getItem('token');
    axios.get('http://localhost:5000/api/ftp-connections', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        setFtpConnections(response.data);
      })
      .catch((err) => {
        console.error('Error loading FTP connections:', err);
        setError('Failed to load FTP connections');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [userId]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewFtp(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleAddFtp = async (e) => {
    e.preventDefault();
    if (!userId) {
      setError('User not authenticated');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const postData = { ...newFtp }; // Remove user_id

      const response = await axios.post(
        'http://localhost:5000/api/ftp-connections',
        postData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        // Refresh the list after successful addition
        const res = await axios.get(
          'http://localhost:5000/api/ftp-connections',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setFtpConnections(res.data);
        // Reset form
        setNewFtp({
          name: '',
          host: '',
          username: '',
          password: '',
          port: 21,
        });
      } else {
        setError('Failed to add FTP connection');
      }
    } catch (error) {
      console.error('Error adding FTP connection:', error);
      setError(error.response?.data?.message || 'Error adding FTP connection');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>FTP Connections</strong>
            {isLoading && <span className="float-end">Loading...</span>}
          </CCardHeader>
          <CCardBody>
            {error && (
              <div className="alert alert-danger">
                {error}
              </div>
            )}
            
            <CTable striped hover responsive>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>#</CTableHeaderCell>
                  <CTableHeaderCell>Name</CTableHeaderCell>
                  <CTableHeaderCell>Host</CTableHeaderCell>
                  <CTableHeaderCell>Username</CTableHeaderCell>
                  <CTableHeaderCell>Port</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {ftpConnections.map((ftp, index) => (
                  <CTableRow key={ftp.id || index}>
                    <CTableDataCell>{index + 1}</CTableDataCell>
                    <CTableDataCell>{ftp.name}</CTableDataCell>
                    <CTableDataCell>{ftp.host}</CTableDataCell>
                    <CTableDataCell>{ftp.username}</CTableDataCell>
                    <CTableDataCell>{ftp.port}</CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          </CCardBody>
        </CCard>

        <CCard>
          <CCardHeader>
            <strong>Add New FTP Connection</strong>
          </CCardHeader>
          <CCardBody>
            <CForm onSubmit={handleAddFtp}>
              <CRow className="mb-3">
                <CCol md={6}>
                  <CFormLabel>Name</CFormLabel>
                  <CFormInput
                    type="text"
                    name="name"
                    value={newFtp.name}
                    onChange={handleChange}
                    required
                  />
                </CCol>
                <CCol md={6}>
                  <CFormLabel>Host</CFormLabel>
                  <CFormInput
                    type="text"
                    name="host"
                    value={newFtp.host}
                    onChange={handleChange}
                    required
                  />
                </CCol>
              </CRow>
              <CRow className="mb-3">
                <CCol md={6}>
                  <CFormLabel>Username</CFormLabel>
                  <CFormInput
                    type="text"
                    name="username"
                    value={newFtp.username}
                    onChange={handleChange}
                    required
                  />
                </CCol>
                <CCol md={6}>
                  <CFormLabel>Password</CFormLabel>
                  <CFormInput
                    type="password"
                    name="password"
                    value={newFtp.password}
                    onChange={handleChange}
                    required
                  />
                </CCol>
              </CRow>
              <CRow className="mb-3">
                <CCol md={6}>
                  <CFormLabel>Port</CFormLabel>
                  <CFormInput
                    type="number"
                    name="port"
                    value={newFtp.port}
                    onChange={handleChange}
                    required
                    min="1"
                    max="65535"
                  />
                </CCol>
              </CRow>
              <CButton 
                color="primary" 
                type="submit" 
                disabled={isLoading}
              >
                {isLoading ? 'Adding...' : 'Add FTP Connection'}
              </CButton>
            </CForm>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  );
};

export default FtpConnections;