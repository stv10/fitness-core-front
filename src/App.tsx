import { AuthProvider, useAuth } from './context/AuthContext'
import { Login } from './components/Login'
import { Dashboard } from './components/Dashboard'

function AppContent() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="loader-spinner-wrapper">
        <div className="loader-glow-ring"></div>
        <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-heading)' }}>
          Verificando sesión...
        </span>
      </div>
    )
  }

  return user ? <Dashboard /> : <Login />
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
