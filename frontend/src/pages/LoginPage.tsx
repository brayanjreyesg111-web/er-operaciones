import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import logoEr from '../assets/logo_er.png'

function resolverRutaPorRol(role: string) {
  if (role === 'ADMINISTRADOR') return '/portal/admin'
  if (role === 'SUPERVISOR') return '/portal/supervisor'
  if (role === 'ADMINISTRATIVO_FINANZAS') return '/portal/administrativo'
  if (role === 'CLIENTE') return '/portal/cliente'
  return '/portal/tecnico'
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    try {
      setGuardando(true)
      const user = await login(email, password)
      navigate(resolverRutaPorRol(user.role), { replace: true })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="authWavePage">
      <div className="authWave authWaveOne" />
      <div className="authWave authWaveTwo" />
      <div className="authWave authWaveThree" />

      <form className="authGlassCard" onSubmit={onSubmit}>
        <div className="authLogoWrap">
          <img src={logoEr} alt="Logo Expertos en Refrigeración" className="authLogo" />
        </div>

        <div className="authFormBody">
          <h1>Login interno</h1>

          <label>
            Correo
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@empresa.com"
              autoComplete="username"
            />
          </label>

          <label>
            Contraseña
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </label>

          {error && <div className="errorBox">{error}</div>}

          <button className="btnPortalPrincipal authSubmitButton" type="submit" disabled={guardando}>
            {guardando ? 'Ingresando...' : 'Ingresar'}
          </button>

          <Link className="authBackLink" to="/">
            Regresar al portal principal
          </Link>
        </div>
      </form>
    </div>
  )
}
