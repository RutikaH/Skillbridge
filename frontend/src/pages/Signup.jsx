import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import AuthCard from '../components/AuthCard'
import InputField from '../components/InputField'
import LoadingButton from '../components/LoadingButton'
import SocialButton from '../components/SocialButton'
import { signup, setToken } from '../services/authService'

export default function Signup() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
      await signup(form)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = () => {
    window.open('/auth/google/login', 'SkillBridge Google Login', 'width=520,height=700')
  }

  return (
    <AuthLayout
      title="Create your SkillBridge account"
      subtitle="Sign up fast and protect your AI workspace with secure credentials."
    >
      <AuthCard title="Create account" description="Set up your SkillBridge login and continue to your dashboard.">
        <form className="auth-form" onSubmit={handleSubmit}>
          <InputField
            label="Full Name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            placeholder="Your full name"
            autoComplete="name"
          />
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
            placeholder="Create a strong password"
            autoComplete="new-password"
          />
          {error && <div className="field-error">{error}</div>}
          <LoadingButton type="submit" loading={loading}>
            Sign up
          </LoadingButton>
        </form>
        <div className="divider">or sign up with</div>
        <SocialButton icon="G" onClick={handleGoogle}>
          Sign up with Google
        </SocialButton>
      </AuthCard>
      <div className="auth-secondary">
        <span>Already have an account? <Link to="/login">Log in</Link></span>
      </div>
    </AuthLayout>
  )
}
