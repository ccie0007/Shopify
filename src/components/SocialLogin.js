import React from 'react'
import { useNavigate } from 'react-router-dom' // Import this
import { signInWithPopup, GoogleAuthProvider, FacebookAuthProvider } from 'firebase/auth'
import { FcGoogle } from 'react-icons/fc'
import { FaFacebook } from 'react-icons/fa'
import '../scss/SocialLogin.scss'
import { CButton } from '@coreui/react'

// Import your initialized Firebase auth object
import { auth } from '../firebase' // Adjust path as needed

const SocialLogin = () => {
  const navigate = useNavigate() // Create navigate instance

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider()
    try {
      const result = await signInWithPopup(auth, provider)
      const user = result.user
      console.log('Google Login Success:', user)
      // Redirect to dashboard after successful login
      navigate('/dashboard')
    } catch (error) {
      console.error('Google Login Error:', error.message)
    }
  }

  const handleFacebookLogin = async () => {
    const provider = new FacebookAuthProvider()
    try {
      const result = await signInWithPopup(auth, provider)
      const user = result.user
      console.log('Facebook Login Success:', user)
      // Redirect to dashboard after successful login
      navigate('/dashboard')
    } catch (error) {
      console.error('Facebook Login Error:', error.message)
    }
  }

  return (
    <div className="social-login d-flex flex-column gap-3 justify-content-center">
      <CButton
        color="light"
        variant="outline"
        onClick={handleGoogleLogin}
        className="btn-google d-flex align-items-center"
      >
        <FcGoogle className="icon" size={20} />
        Continue with Google
      </CButton>

      <CButton
        color="primary"
        onClick={handleFacebookLogin}
        className="btn-facebook d-flex align-items-center"
      >
        <FaFacebook className="icon" size={20} />
        Continue with Facebook
      </CButton>
    </div>
  )
}

export default SocialLogin
