import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import LoginPage from '../pages/LoginPage'
import AdminDashboard from '../pages/dashboard/AdminDashboard'
import SupervisorDashboard from '../pages/dashboard/SupervisorDashboard'
import TecnicoDashboard from '../pages/dashboard/TecnicoDashboard'
import PublicPortalPage from '../pages/public/PublicPortalPage'
import ReportesPage from '../pages/reportes/ReportesPage'

function normalizarRol(role?: string | null) {
  const limpio = String(role || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase()

  if (limpio.includes('ADMINISTRADOR') || limpio === 'ADMIN') return 'ADMINISTRADOR'
  if (limpio.includes('SUPERVISOR')) return 'SUPERVISOR'
  if (limpio.includes('FINANZAS') || limpio.includes('ADMINISTRATIVO')) return 'ADMINISTRATIVO_FINANZAS'
  if (limpio.includes('CLIENTE')) return 'CLIENTE'
  if (limpio.includes('TECNICO')) return 'TECNICO'

  return limpio
}

function resolverRutaPorRol(role?: string | null) {
  const rol = normalizarRol(role)
  if (rol === 'ADMINISTRADOR') return '/portal/admin'
  if (rol === 'SUPERVISOR') return '/portal/supervisor'
  if (rol === 'ADMINISTRATIVO_FINANZAS') return '/portal/administrativo'
  if (rol === 'CLIENTE') return '/portal/cliente'
  return '/portal/tecnico'
}

function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode
  allowedRoles: string[]
}) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="authPage">Cargando sesión...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const rolUsuario = normalizarRol(user.role)
  const rolesPermitidos = allowedRoles.map(normalizarRol)

  if (!rolesPermitidos.includes(rolUsuario)) {
    return <Navigate to={resolverRutaPorRol(rolUsuario)} replace />
  }

  return <>{children}</>
}

function PortalHomeRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="authPage">Cargando sesión...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Navigate to={resolverRutaPorRol(user.role)} replace />
}

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<PublicPortalPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/portal" element={<PortalHomeRoute />} />

      <Route
        path="/portal/admin"
        element={
          <ProtectedRoute allowedRoles={['ADMINISTRADOR']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/portal/supervisor"
        element={
          <ProtectedRoute allowedRoles={['SUPERVISOR', 'ADMINISTRADOR']}>
            <SupervisorDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/portal/tecnico"
        element={
          <ProtectedRoute allowedRoles={['TECNICO', 'SUPERVISOR', 'ADMINISTRADOR']}>
            <TecnicoDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/portal/reportes"
        element={
          <ProtectedRoute allowedRoles={['TECNICO', 'SUPERVISOR', 'ADMINISTRADOR']}>
            <ReportesPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}



