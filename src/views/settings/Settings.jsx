import React, { useState } from 'react'
import PasswordChange from './PasswordChange'

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile')

  return (
    <div>
      <h2>Settings</h2>
      <nav style={{ marginBottom: '1rem' }}>
        <button
          onClick={() => setActiveTab('profile')}
          style={{
            marginRight: '10px',
            backgroundColor: activeTab === 'profile' ? '#0d6efd' : '#e0e0e0',
            color: activeTab === 'profile' ? 'white' : 'black',
            padding: '8px 16px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Profile
        </button>
        <button
          onClick={() => setActiveTab('password')}
          style={{
            backgroundColor: activeTab === 'password' ? '#0d6efd' : '#e0e0e0',
            color: activeTab === 'password' ? 'white' : 'black',
            padding: '8px 16px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Change Password
        </button>
      </nav>

      <div>
        {activeTab === 'profile' && (
          <div>
            <h3>Your Profile</h3>
            <p>Here you can add profile info settings.</p>
            {/* You can add inputs for name, email etc here */}
          </div>
        )}
        {activeTab === 'password' && <PasswordChange />}
      </div>
    </div>
  )
}

export default Settings
