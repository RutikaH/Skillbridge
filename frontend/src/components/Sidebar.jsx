import { NavLink } from 'react-router-dom'

const items = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/skills', label: 'Skills' },
  { to: '/assessments', label: 'Assessments' },
  { to: '/opportunities', label: 'Opportunities' },
  { to: '/profile', label: 'Profile' },
  { to: '/settings', label: 'Settings' },
]

const navIcons = {
  '/dashboard': '◼︎',
  '/skills': '⌁',
  '/assessments': '⟡',
  '/opportunities': '◆',
  '/profile': '◻︎',
  '/settings': '⚙︎',
}

export default function Sidebar({ currentPath, onLogout }) {
  return (
    <aside className="sidebar" aria-label="Primary">
      <div className="sidebar-inner">
        <div className="sidebar-brand">
          <div className="logo-mark" aria-hidden>
            SB
          </div>
          <div className="brand-text">
            <div className="brand-name">SkillBridge</div>
            <div className="brand-sub">SaaS Platform</div>
          </div>
        </div>

        <div className="sidebar-section-label" aria-hidden>
          WORKSPACE
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              <span className="nav-icon" aria-hidden>
                {navIcons[it.to] ?? '•'}
              </span>
              <span className="nav-label">{it.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-divider" aria-hidden />

        <div className="sidebar-footer">
          <button className="btn btn-ghost" onClick={onLogout} type="button">
            Logout
          </button>
          <div className="sidebar-meta">
            <div className="sidebar-version">v1.0</div>
            <div className="sidebar-copyright">SkillBridge © 2026</div>
          </div>
        </div>
      </div>
    </aside>
  )
}



