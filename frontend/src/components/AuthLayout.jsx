export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="auth-shell">
      <div className="auth-background" />
      <div className="auth-container">
        <div className="auth-panel">
          <div className="auth-left">
            <div className="auth-brand">
              <span>SkillBridge</span>
              <small>AI Access</small>
            </div>
            <div className="auth-copy">
              <h1>{title}</h1>
              <p>{subtitle}</p>
            </div>
          </div>

          <div className="auth-right">
            <div className="auth-card">{children}</div>
            {footer && <div className="auth-footer">{footer}</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
