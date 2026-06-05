import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'

interface Workout {
  id: number
  type: string
  duration: number
  time: string
}

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth()
  
  // Workouts simulation
  const [workouts, setWorkouts] = useState<Workout[]>([
    { id: 1, type: 'Cardio Run', duration: 30, time: '08:30 AM' },
    { id: 2, type: 'Entrenamiento de Fuerza', duration: 45, time: '12:15 PM' }
  ])
  const [workoutType, setWorkoutType] = useState('Cardio')
  const [workoutDuration, setWorkoutDuration] = useState('30')

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

  const totalMinutes = workouts.reduce((sum, w) => sum + w.duration, 0)

  if (!user) return null

  // Format date
  const joinedDate = user.id ? 'Hoy' : 'Recientemente'

  return (
    <div className="dashboard-wrapper">
      {/* Sidebar / Navigation */}
      <header className="dashboard-header">
        <div className="brand">
          <span className="brand-icon">⚡</span>
          <span className="brand-name">Fitness Core</span>
        </div>
        <div className="user-nav">
          <div className="user-profile-badge">
            <span className="user-avatar">{user.firstName[0]}{user.lastName[0]}</span>
            <span className="user-name-text">{user.firstName} {user.lastName}</span>
            <span className={`role-tag ${user.role.toLowerCase()}`}>{user.role}</span>
          </div>
          <button className="btn-logout" onClick={logout}>
            Cerrar Sesión
          </button>
        </div>
      </header>

      <main className="dashboard-content">
        {/* Welcome Section */}
        <section className="welcome-banner">
          <h1>¡Hola, {user.firstName}! 👋</h1>
          <p>Tu sesión está activa y segura. Este es tu panel de rendimiento cargado en tiempo real.</p>
        </section>

        {/* Bento Grid Layout */}
        <div className="bento-grid">
          
          {/* Card 1: Perfil de Usuario */}
          <div className="bento-card card-profile">
            <div className="card-header">
              <span className="card-emoji">👤</span>
              <h3>Perfil del Atleta</h3>
            </div>
            <div className="card-body">
              <div className="profile-details">
                <div className="detail-item">
                  <span className="detail-label">NOMBRE</span>
                  <span className="detail-val">{user.firstName} {user.lastName}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">EMAIL</span>
                  <span className="detail-val">{user.email}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">REGISTRO</span>
                  <span className="detail-val">{joinedDate}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Hydration Stats (Sky Blue) */}
          <div className="bento-card card-hydration">
            <div className="card-header">
              <span className="card-emoji">💧</span>
              <h3>Hidratación</h3>
            </div>
            <div className="card-body">
              <div className="metric-display">
                <span className="metric-num text-tertiary">1.2</span>
                <span className="metric-unit">/ 3.0 Litros</span>
              </div>
              <div className="progress-bar-container">
                <div className="progress-bar bg-tertiary" style={{ width: '40%' }}></div>
              </div>
              <p className="card-tip">¡Buen ritmo! Necesitás tomar 1.8L más hoy para cumplir tu meta.</p>
            </div>
          </div>

          {/* Card 3: Calorie Logger (Soft Coral) */}
          <div className="bento-card card-calories">
            <div className="card-header">
              <span className="card-emoji">🔥</span>
              <h3>Energía diaria</h3>
            </div>
            <div className="card-body">
              <div className="metric-display">
                <span className="metric-num text-secondary">840</span>
                <span className="metric-unit">/ 2500 kcal</span>
              </div>
              <div className="progress-bar-container">
                <div className="progress-bar bg-secondary" style={{ width: '33.6%' }}></div>
              </div>
              <p className="card-tip">Consumido: 33.6% de tu límite diario sugerido.</p>
            </div>
          </div>

          {/* Card 4: AI Recommendations (Glass with Glow) */}
          <div className="bento-card card-ai">
            <div className="card-header">
              <span className="card-emoji">✨</span>
              <h3>Recomendaciones IA</h3>
            </div>
            <div className="card-body">
              <div className="ai-message-bubble">
                <div className="ai-header">
                  <span className="sparkle-icon">✦</span>
                  <strong>Fitness Core AI</strong>
                </div>
                <p>Noté que entrenaste fuerza hoy al mediodía. Te sugiero un snack proteico (ej: 150g de yogurt griego con nueces) y asegurar 500ml de agua adicionales para optimizar la recuperación muscular.</p>
              </div>
              <button className="btn-ai-action">
                <span>Generar Rutina de Mañana</span>
              </button>
            </div>
          </div>

          {/* Card 5: Interactive Workout Simulator (Electric Lime) */}
          <div className="bento-card card-logger col-span-2">
            <div className="card-header">
              <span className="card-emoji">🏋️</span>
              <h3>Registro de Actividad Física</h3>
            </div>
            <div className="card-body logger-body">
              <div className="logger-list-container">
                <ul className="dashboard-workout-list">
                  {workouts.length === 0 ? (
                    <li className="no-workouts">No hay actividades registradas hoy.</li>
                  ) : (
                    workouts.map(w => (
                      <li key={w.id} className="dashboard-workout-item">
                        <div className="workout-info">
                          <span className="workout-bullet">•</span>
                          <strong>{w.type}</strong>
                          <span className="workout-duration">{w.duration} min</span>
                        </div>
                        <span className="workout-time">{w.time}</span>
                      </li>
                    ))
                  )}
                </ul>
                <div className="workout-summary">
                  <span>Total Ejercicio Activo:</span>
                  <span className="text-primary-lime">{totalMinutes} minutos</span>
                </div>
              </div>

              <form onSubmit={addWorkout} className="dashboard-workout-form">
                <div className="form-select-group">
                  <select 
                    value={workoutType} 
                    onChange={(e) => setWorkoutType(e.target.value)}
                  >
                    <option value="Cardio">Cardio</option>
                    <option value="Entrenamiento de Fuerza">Fuerza</option>
                    <option value="Yoga / Estiramiento">Yoga</option>
                    <option value="Ciclismo">Ciclismo</option>
                    <option value="Natación">Natación</option>
                  </select>
                  <select 
                    value={workoutDuration} 
                    onChange={(e) => setWorkoutDuration(e.target.value)}
                  >
                    <option value="15">15 min</option>
                    <option value="30">30 min</option>
                    <option value="45">45 min</option>
                    <option value="60">60 min</option>
                    <option value="90">90 min</option>
                  </select>
                </div>
                <button type="submit" className="btn-add-workout">+</button>
              </form>
            </div>
          </div>

        </div>
      </main>

      <footer className="dashboard-footer">
        <span>© 2026 Fitness Core Project. Autenticación y Sesión Segura por Token.</span>
      </footer>
    </div>
  )
}
