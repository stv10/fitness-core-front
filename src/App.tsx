import { useState, useEffect } from 'react'
import './App.css'

interface Workout {
  id: number;
  type: string;
  duration: number;
  time: string;
}

function App() {
  // Local network status (PWA)
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine)
  
  // Backend API connection status
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking')
  const [apiData, setApiData] = useState<any>(null)
  
  // Mock Workouts state
  const [workouts, setWorkouts] = useState<Workout[]>([
    { id: 1, type: 'Cardio Run', duration: 30, time: '08:30 AM' },
    { id: 2, type: 'Strength Training', duration: 45, time: '12:15 PM' }
  ])
  const [workoutType, setWorkoutType] = useState('Cardio')
  const [workoutDuration, setWorkoutDuration] = useState('30')

  // API URL from env variables
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080'

  useEffect(() => {
    // Listeners for PWA network changes
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Check backend health
    checkBackendHealth()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const checkBackendHealth = async () => {
    setApiStatus('checking')
    try {
      const response = await fetch(`${apiUrl}/api/ping`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      })
      if (response.ok) {
        const data = await response.json()
        setApiData(data)
        setApiStatus('online')
      } else {
        setApiStatus('offline')
      }
    } catch (error) {
      console.error('Error fetching API status:', error)
      setApiStatus('offline')
    }
  }

  const addWorkout = (e: React.FormEvent) => {
    e.preventDefault()
    if (!workoutType || !workoutDuration) return
    
    const newWorkout: Workout = {
      id: Date.now(),
      type: workoutType,
      duration: parseInt(workoutDuration),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    
    setWorkouts([newWorkout, ...workouts])
    setWorkoutType('Cardio')
    setWorkoutDuration('30')
  }

  // Calculate stats
  const totalMinutes = workouts.reduce((sum, w) => sum + w.duration, 0)

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="brand">
          <span className="brand-icon">⚡</span>
          <span className="brand-name">Fitness Core</span>
        </div>
        <div className="status-badges">
          <div className="badge">
            Network: {isOnline ? (
              <>
                <span className="status-dot online"></span>
                <span>Online</span>
              </>
            ) : (
              <>
                <span className="status-dot offline"></span>
                <span>Offline (PWA Mode)</span>
              </>
            )}
          </div>
          <div className="badge" onClick={checkBackendHealth} style={{ cursor: 'pointer' }} title="Click to refresh">
            Backend API: {apiStatus === 'checking' ? (
              <span>Checking...</span>
            ) : apiStatus === 'online' ? (
              <>
                <span className="status-dot online"></span>
                <span>Connected</span>
              </>
            ) : (
              <>
                <span className="status-dot offline"></span>
                <span>Disconnected</span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <h1 className="hero-title">Open-Source Health & Fitness Ecosystem</h1>
        <p className="hero-subtitle">
          Una aplicación moderna construida con Spring Boot 4 y React 18, diseñada para funcionar offline como PWA y escalar en la nube.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <a href="#dashboard" className="btn-primary">Ver Dashboard</a>
          <a href="https://github.com/fitness-core" className="btn-secondary" target="_blank" rel="noopener noreferrer">Documentación</a>
        </div>
      </section>

      {/* Main Dashboard */}
      <main id="dashboard" className="dashboard-grid">
        
        {/* Card 1: PWA Status */}
        <section className="premium-card">
          <span className="card-icon">📱</span>
          <h2 className="card-title">Progressive Web App (PWA)</h2>
          <p className="card-description">
            Esta app está lista para instalarse en tu dispositivo. Gracias al Service Worker y Workbox, los recursos estáticos se cachean automáticamente, permitiendo el uso offline.
          </p>
          <div className="card-body">
            <div className="interactive-section">
              <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Estrategia de Caché:</p>
              <ul style={{ listStyle: 'none', paddingLeft: '0.2rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <li>✔️ HTML/JS/CSS: CacheFirst / StaleWhileRevalidate</li>
                <li>✔️ Service Worker registrado en segundo plano</li>
                <li>✔️ Manifest con soporte para instalación de escritorio/móvil</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Card 2: Backend Integration */}
        <section className="premium-card">
          <span className="card-icon">⚙️</span>
          <h2 className="card-title">Spring Boot API (Java 25)</h2>
          <p className="card-description">
            Conexión en tiempo real con nuestro backend. Esta tarjeta consulta el endpoint de salud `/api/ping` usando variables de entorno protegidas.
          </p>
          <div className="card-body" style={{ gap: '1rem' }}>
            <div className="json-display">
              {apiStatus === 'checking' && '// Connecting to backend...'}
              {apiStatus === 'online' && JSON.stringify(apiData, null, 2)}
              {apiStatus === 'offline' && '// Backend is currently unreachable.\n// Start the spring-boot server.'}
            </div>
            <button className="btn-primary" onClick={checkBackendHealth} style={{ width: '100%' }}>
              Re-comprobar API
            </button>
          </div>
        </section>

        {/* Card 3: Interactive Workout Logger */}
        <section className="premium-card">
          <span className="card-icon">🏋️</span>
          <h2 className="card-title">Simulador de Entrenamientos</h2>
          <p className="card-description">
            Interactúa con el estado local de React. Simula el registro de entrenamientos rápidos que se sincronizan localmente.
          </p>
          <div className="card-body">
            <div className="interactive-section" style={{ background: 'rgba(255,255,255,0.01)', padding: '0.5rem', marginBottom: '1rem' }}>
              <ul className="workout-list">
                {workouts.map(w => (
                  <li key={w.id} className="workout-item">
                    <span>{w.type} ({w.duration} min)</span>
                    <span style={{ color: 'var(--text-muted)' }}>{w.time}</span>
                  </li>
                ))}
              </ul>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 'bold', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
                <span>Total Hoy:</span>
                <span style={{ color: 'var(--accent-secondary)' }}>{totalMinutes} min</span>
              </div>
            </div>

            <form onSubmit={addWorkout} style={{ display: 'flex', gap: '0.5rem' }}>
              <select 
                value={workoutType} 
                onChange={(e) => setWorkoutType(e.target.value)}
                style={{ flex: 2, padding: '0.5rem', background: 'var(--bg-tertiary)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '4px' }}
              >
                <option value="Cardio">Cardio</option>
                <option value="Fuerza">Fuerza</option>
                <option value="Yoga">Yoga</option>
                <option value="Ciclismo">Ciclismo</option>
              </select>
              <select 
                value={workoutDuration} 
                onChange={(e) => setWorkoutDuration(e.target.value)}
                style={{ flex: 1.2, padding: '0.5rem', background: 'var(--bg-tertiary)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '4px' }}
              >
                <option value="15">15m</option>
                <option value="30">30m</option>
                <option value="45">45m</option>
                <option value="60">60m</option>
              </select>
              <button type="submit" className="btn-primary" style={{ padding: '0.5rem 1rem' }}>+</button>
            </form>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div>
          <span>© 2026 Fitness Core Project. Bajo Licencia MIT.</span>
        </div>
        <div className="footer-links">
          <a href="#dashboard">Dashboard</a>
          <a href="https://github.com/fitness-core" target="_blank" rel="noopener noreferrer">Repositorio</a>
          <a href="https://spring.io" target="_blank" rel="noopener noreferrer">Spring Boot</a>
          <a href="https://vite.dev" target="_blank" rel="noopener noreferrer">Vite</a>
        </div>
      </footer>
    </div>
  )
}

export default App
