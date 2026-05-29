import { useNavigate } from 'react-router-dom'

export default function TopNavbar({ currentPath }) {
  const navigate = useNavigate()

  const title =
    currentPath.includes('dashboard')
      ? 'Dashboard'
      : currentPath.includes('skills')
        ? 'Skills'
        : currentPath.includes('assessments')
          ? 'Assessments'
          : currentPath.includes('opportunities')
            ? 'Opportunities'
            : currentPath.includes('profile')
              ? 'Profile'
              : currentPath.includes('settings')
                ? 'Settings'
                : 'SkillBridge'

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="page-title">{title}</div>
      </div>
      <div className="topbar-right">
        <button className="btn btn-primary" type="button" onClick={() => navigate('/assessments')}>
          New Assessment
        </button>
      </div>
    </header>
  )
}

