import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import TopNavbar from '../components/TopNavbar'
import { logout } from '../services/authService'

export default function SaaSLayout() {
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="app-shell">
      <Sidebar currentPath={location.pathname} onLogout={handleLogout} />
      <div className="app-main">
        <TopNavbar currentPath={location.pathname} />
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

