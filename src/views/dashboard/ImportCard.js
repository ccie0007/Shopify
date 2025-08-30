import React, { useRef, useState, useEffect } from 'react'
import { CCard, CCardHeader, CCardBody, CButton, CFormInput, CAlert } from '@coreui/react'
import { cilCloudUpload } from '@coreui/icons'
import CIcon from '@coreui/icons-react'

const ImportCard = () => {
  const fileInputRef = useRef()
  const [fileName, setFileName] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [importSource, setImportSource] = useState('upload')
  const [file, setFile] = useState(null)
  const [importMessage, setImportMessage] = useState(null)
  const [importError, setImportError] = useState(null)

  // Auto-dismiss messages after 4 seconds
  useEffect(() => {
    if (importMessage || importError) {
      const timer = setTimeout(() => {
        setImportMessage(null)
        setImportError(null)
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [importMessage, importError])

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFile(file)
      setFileName(file.name)
    }
  }

  // Handle import button click
  const handleImportClick = async () => {
    if (importSource === 'upload') {
      if (!file) return
      const formData = new FormData()
      formData.append('file', file)
      try {
        const res = await fetch('http://localhost:5000/api/import-csv', {
          method: 'POST',
          headers: {
            Authorization: 'Bearer ' + localStorage.getItem('token'),
          },
          body: formData,
        })
        const data = await res.json()
        if (res.ok) {
          setImportMessage(data.message || 'Import completed for: ' + file.name)
          setImportError(null)
        } else {
          setImportError(data.error || 'Import failed')
          setImportMessage(null)
        }
      } catch (err) {
        setImportError('Import failed')
        setImportMessage(null)
      }
    } else {
      setImportError('This import source is not implemented yet.')
      setImportMessage(null)
    }
  }

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault()
    setDragActive(true)
  }
  const handleDragLeave = (e) => {
    e.preventDefault()
    setDragActive(false)
  }
  const handleDrop = (e) => {
    e.preventDefault()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      setFile(droppedFile)
      setFileName(droppedFile.name)
    }
  }

  return (
    <CCard className="shadow-sm" style={{ border: 'none', borderRadius: 16 }}>
      <CCardHeader style={{ background: '#e5e6e8', borderTopLeftRadius: 16, borderTopRightRadius: 16, fontWeight: 600, fontSize: '1.15rem' }}>
        <CIcon icon={cilCloudUpload} style={{ marginRight: 8, color: '#198754' }} />
        Import Products CSV
      </CCardHeader>
      <CCardBody>
        {/* Import Source Selection */}
        <div style={{ marginBottom: '2rem' }}>
          <label style={{ fontWeight: 500 }}>Import Source:</label>
          <select value={importSource} onChange={e => setImportSource(e.target.value)} style={{ marginLeft: 10 }}>
            <option value="upload">Upload from my computer (CSV/Excel)</option>
            <option value="google_sheets">Google Sheets</option>
            <option value="email">Email Attachment</option>
            <option value="ftp">FTP/SFTP Server</option>
            <option value="api">API Endpoint</option>
            <option value="cloud">Dropbox / Google Drive / OneDrive</option>
          </select>
        </div>

        {/* Upload from PC */}
        {importSource === 'upload' && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
              border: dragActive ? '2px solid #198754' : '2px dashed #e5e6e8',
              borderRadius: 12,
              padding: '2rem',
              textAlign: 'center',
              background: dragActive ? '#f8f8f9' : '#fff',
              cursor: 'pointer',
              transition: 'border 0.2s, background 0.2s'
            }}
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
          >
            <CIcon icon={cilCloudUpload} size="xxl" style={{ color: '#198754', marginBottom: 12 }} />
            <div style={{ fontSize: '1.1rem', color: '#222', fontWeight: 500 }}>
              {fileName ? fileName : 'Drag & drop your CSV file here, or click to browse'}
            </div>
            <CFormInput
              type="file"
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              onChange={handleFileChange}
              ref={fileInputRef}
              style={{ display: 'none' }}
            />
          </div>
        )}

        {/* Placeholders for other sources */}
        {importSource === 'google_sheets' && <div>Google Sheets import coming soon.</div>}
        {importSource === 'email' && <div>Email attachment ingestion coming soon.</div>}
        {importSource === 'ftp' && <div>FTP/SFTP server download coming soon.</div>}
        {importSource === 'api' && <div>API endpoint import coming soon.</div>}
        {importSource === 'cloud' && <div>Cloud drive import coming soon.</div>}

        {/* Import Button and Message Inline */}
        {(importSource === 'upload' && fileName) && (
          <div style={{ display: 'flex', alignItems: 'center', marginTop: 24 }}>
            <CButton color="success" className="w-auto" size="lg" style={{ fontWeight: 600 }} onClick={handleImportClick}>
              Import
            </CButton>
            {(importMessage || importError) && (
              <div style={{ marginLeft: 16, flex: 1 }}>
                {importMessage && (
                  <CAlert color="success" className="mb-0 py-2 px-3">
                    {importMessage}
                  </CAlert>
                )}
                {importError && (
                  <CAlert color="danger" className="mb-0 py-2 px-3">
                    {importError}
                  </CAlert>
                )}
              </div>
            )}
          </div>
        )}
      </CCardBody>
    </CCard>
  )
}

export default ImportCard