import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import AuthCard from '../components/AuthCard'
import InputField from '../components/InputField'
import LoadingButton from '../components/LoadingButton'
import { forgotPassword } from '../services/authService'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await forgotPassword({ email })
      setSuccess(response.message || 'Recovery instructions have been sent.')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Forgot your password?"
      subtitle="Enter the email tied to your account to receive recovery instructions."
    >
      <AuthCard title="Password recovery" description="We’ll send a secure reset link if your email is registered.">
        <form className="auth-form" onSubmit={handleSubmit}>
          <InputField
            label="Email address"
            name="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />
          {error && <div className="field-error">{error}</div>}
          {success && <div className="field-success">{success}</div>}
          <LoadingButton type="submit" loading={loading}>
            Send recovery link
          </LoadingButton>
        </form>
      </AuthCard>
      <div className="auth-secondary">
        <Link to="/login">Back to login</Link>
      </div>
    </AuthLayout>
  )
}
