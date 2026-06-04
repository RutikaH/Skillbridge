import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import AuthCard from '../components/AuthCard'
import InputField from '../components/InputField'
import LoadingButton from '../components/LoadingButton'
import SocialButton from '../components/SocialButton'
import { login, setToken, isAuthenticated } from '../services/authService'

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/dashboard')
    }
  }, [navigate])

  useEffect(() => {
    const handler = (event) => {
      const allowedOrigins = [window.location.origin]
      if (!allowedOrigins.includes(event.origin)) {
        return
      }
      if (event.data?.token) {
        setToken(event.data.token)
        navigate('/dashboard')
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [navigate])

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      await login(form)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = () => {
    setError('')
    const width = 520
    const height = 700
    const left = window.screenX + (window.innerWidth - width) / 2
    const top = window.screenY + (window.innerHeight - height) / 2
    const popup = window.open(
      '/auth/google/login',
      'SkillBridge Google Login',
      `width=${width},height=${height},left=${left},top=${top}`
    )

    if (!popup) {
      setError('Popup blocked. Please allow popups and try again.')
    }
  }

  return (
    <AuthLayout
      title="Sign in to SkillBridge"
      subtitle="Enter your credentials or use Google to unlock your AI workspace."
    >
      <AuthCard title="Welcome back" description="Secure access to your SkillBridge AI sessions.">
        <form className="auth-form" onSubmit={handleSubmit}>
          <InputField
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            autoComplete="email"
          />
          <InputField
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Enter your password"
            autoComplete="current-password"
          />
          {error && <div className="field-error">{error}</div>}
          <LoadingButton type="submit" loading={loading}>
            Continue
          </LoadingButton>
        </form>
        <div className="divider">or continue with</div>
        <SocialButton icon="G" onClick={handleGoogle}>
          Continue with Google
        </SocialButton>
      </AuthCard>
      <div className="auth-secondary">
        {/* <Link to="/forgot-password">Forgot password?</Link> */}
        <span>Don’t have an account? <Link to="/signup">Sign up</Link></span>
      </div>
    </AuthLayout>
  )
}
