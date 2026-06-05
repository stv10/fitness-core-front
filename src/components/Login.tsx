import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export const Login: React.FC = () => {
  const { login } = useAuth()
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080'

  const triggerError = (msg: string) => {
    setError(msg)
    setShake(true)
    setTimeout(() => setShake(false), 500)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (!email || !password) {
      triggerError('Por favor complete todos los campos requeridos.')
      setLoading(false)
      return
    }

    if (isRegister && (!firstName || !lastName)) {
      triggerError('Nombre y Apellido son obligatorios para el registro.')
      setLoading(false)
      return
    }

    if (isRegister && password.length < 6) {
      triggerError('La contraseña debe tener al menos 6 caracteres.')
      setLoading(false)
      return
    }

    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login'
    const payload = isRegister 
      ? { email, password, firstName, lastName }
      : { email, password }

    try {
      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (!response.ok) {
        triggerError(data.message || 'Ocurrió un error inesperado.')
        return
      }

      // Success
      login(data.token, data.user)
    } catch (err: any) {
      console.error('Auth request failed:', err)
      triggerError('Error de red. No se pudo conectar con el servidor.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-wrapper">
      <div className={`auth-card ${shake ? 'shake' : ''}`}>
        <div className="auth-brand">
          <span className="auth-brand-icon">⚡</span>
          <span className="auth-brand-name">Fitness Core</span>
        </div>
        
        <h2 className="auth-title">
          {isRegister ? 'Crear Cuenta' : 'Iniciar Sesión'}
        </h2>
        
        <p className="auth-subtitle">
          {isRegister 
            ? 'Registrate para iniciar tu control nutricional y deportivo' 
            : 'Ingresá tus credenciales para acceder a tu panel de entrenamiento'}
        </p>

        {error && (
          <div className="auth-error-alert">
            <span className="alert-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {isRegister && (
            <div className="form-row">
              <div className="form-group">
                <input 
                  type="text" 
                  id="firstName"
                  value={firstName} 
                  onChange={(e) => setFirstName(e.target.value)} 
                  required
                  placeholder=" "
                />
                <label htmlFor="firstName">Nombre</label>
              </div>
              <div className="form-group">
                <input 
                  type="text" 
                  id="lastName"
                  value={lastName} 
                  onChange={(e) => setLastName(e.target.value)} 
                  required
                  placeholder=" "
                />
                <label htmlFor="lastName">Apellido</label>
              </div>
            </div>
          )}

          <div className="form-group">
            <input 
              type="email" 
              id="email"
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required
              placeholder=" "
            />
            <label htmlFor="email">Correo Electrónico</label>
          </div>

          <div className="form-group">
            <input 
              type="password" 
              id="password"
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required
              placeholder=" "
            />
            <label htmlFor="password">Contraseña</label>
          </div>

          <button type="submit" className="auth-btn-primary" disabled={loading}>
            {loading ? (
              <span className="loader-text">Procesando...</span>
            ) : (
              <span>{isRegister ? 'Registrarse' : 'Ingresar'}</span>
            )}
          </button>
        </form>

        <div className="auth-switch">
          <span>
            {isRegister ? '¿Ya tenés cuenta?' : '¿No tenés cuenta todavía?'}
          </span>
          <button 
            type="button" 
            className="auth-link" 
            onClick={() => {
              setIsRegister(!isRegister)
              setError(null)
            }}
          >
            {isRegister ? 'Iniciá Sesión' : 'Registrate gratis'}
          </button>
        </div>
      </div>
    </div>
  )
}
