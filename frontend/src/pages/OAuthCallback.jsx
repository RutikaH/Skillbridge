import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { setToken } from '../services/authService'

export default function OAuthCallback() {
  const navigate = useNavigate()
  const [message, setMessage] = useState('Finalizing sign in...')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')

    if (token) {
      setToken(token)
      const forwarded = window.opener && window.opener !== window
      if (forwarded) {
        try {
          window.opener.postMessage({ token }, window.location.origin)
        } catch (e) {
          window.opener.postMessage({ token }, '*')
        }
        window.close()
        return
      }
      navigate('/dashboard')
      return
    }

    setMessage('Unable to complete sign-in. Redirecting to login...')
    const timeout = setTimeout(() => navigate('/login'), 2200)
    return () => clearTimeout(timeout)
  }, [navigate])

  return (
    <div className="oauth-callback-shell">
      <div className="oauth-callback-card">
        <h2>Google sign in</h2>
        <p>{message}</p>
      </div>
    </div>
  )
}
