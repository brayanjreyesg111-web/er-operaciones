import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import RoleActionBar from '../../components/layout/RoleActionBar'
import PortalTrabajoActual from '../../PortalTrabajoActual'
import type { VistaActual } from '../../types/reportes.types'

function resolverVistaDesdeQuery(value: string | null): VistaActual | undefined {
  if (value === 'cliente') return 'cliente'
  if (value === 'crear') return 'crear'
  if (value === 'maquina') return 'maquina'
  return undefined
}

function resolverRutaDashboardDesdeQuery(value: string | null): string | undefined {
  if (value === 'admin') return '/portal/admin'
  if (value === 'supervisor') return '/portal/supervisor'
  if (value === 'tecnico') return '/portal/tecnico'
  if (value === 'administrativo') return '/portal/administrativo'
  if (value === 'cliente') return '/portal/cliente'
  return undefined
}

function resolverRutaPorRol(role?: string) {
  if (role === 'ADMINISTRADOR') return '/portal/admin'
  if (role === 'SUPERVISOR') return '/portal/supervisor'
  if (role === 'ADMINISTRATIVO_FINANZAS') return '/portal/administrativo'
  if (role === 'CLIENTE') return '/portal/cliente'
  return '/portal/tecnico'
}

function resolverTitulo(vista: VistaActual) {
  if (vista === 'cliente') return 'Registrar cliente'
  if (vista === 'maquina') return 'Registrar máquina'
  return 'Crear reporte'
}

function resolverDescripcion(vista: VistaActual, puedeGestionarClientes: boolean) {
  if (vista === 'cliente') {
    return 'Alta rápida del cliente desde la vista autorizada del supervisor.'
  }

  if (vista === 'maquina') {
    return 'Registro operativo de la máquina ligado al cliente que ya estás trabajando.'
  }

  return puedeGestionarClientes
    ? 'Flujo directo para crear reportes y, si hace falta, abrir registros auxiliares desde la supervisión.'
    : 'Flujo directo para crear reportes con clientes ya existentes, sin botones que desordenen el trabajo técnico.'
}

export default function ReportesPage() {
  const { logout, user } = useAuth()
  const [searchParams] = useSearchParams()

  const puedeGestionarClientes = user?.role === 'SUPERVISOR'
  const vistaQuery = resolverVistaDesdeQuery(searchParams.get('abrir')) || 'crear'
  const vistaInicial = !puedeGestionarClientes && vistaQuery === 'cliente' ? 'crear' : vistaQuery
  const contextoInicial = searchParams.get('context') === 'dashboard' ? 'dashboard' : 'reportes'
  const rutaMenu =
    resolverRutaDashboardDesdeQuery(searchParams.get('from')) || resolverRutaPorRol(user?.role)

  const fromParam = searchParams.get('from')
  const fromSuffix = fromParam ? `&from=${fromParam}` : ''

  const items = useMemo(() => {
    const baseItems = [
      {
        label: 'Crear reporte',
        href: `/portal/reportes?abrir=crear&context=reportes${fromSuffix}`,
        active: vistaInicial === 'crear',
      },
      {
        label: 'Máquina',
        href: `/portal/reportes?abrir=maquina&context=reportes${fromSuffix}`,
        active: vistaInicial === 'maquina',
      },
    ]

    if (puedeGestionarClientes) {
      baseItems.splice(1, 0, {
        label: 'Cliente',
        href: `/portal/reportes?abrir=cliente&context=reportes${fromSuffix}`,
        active: vistaInicial === 'cliente',
      })
    }

    return [...baseItems, { label: 'Volver al panel', href: rutaMenu, tone: 'ghost' as const }]
  }, [fromSuffix, puedeGestionarClientes, rutaMenu, vistaInicial])

  const titulo = resolverTitulo(vistaInicial)
  const descripcion = resolverDescripcion(vistaInicial, puedeGestionarClientes)

  return (
    <div className="portalShell roleShell reportesShellV2">
      <header className="dashboardTopbar dashboardTopbarCompact">
        <div>
          <div className="topbarEyebrow">Portal interno · Flujo operativo</div>
          <h1>{titulo}</h1>
          <p>{descripcion}</p>
        </div>

        <button className="powerLogoutButton" type="button" onClick={logout}>
          <span className="powerIcon">⏻</span>
          <span>Cerrar sesión</span>
        </button>
      </header>

      <main className="dashboardContainer roleDashboardContainer reportesDirectWrap reportesDirectWrapResponsive">
        <RoleActionBar items={items} />
        <PortalTrabajoActual
          modoDirecto
          initialVista={vistaInicial}
          initialContext={contextoInicial}
          returnPath={rutaMenu}
        />
      </main>
    </div>
  )
}
