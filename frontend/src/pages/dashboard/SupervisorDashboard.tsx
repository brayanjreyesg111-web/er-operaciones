import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import RoleActionBar from '../../components/layout/RoleActionBar'
import {
  construirDashboardSupervisor,
  obtenerDashboardBaseData,
  textoSolicitudUbicacion,
  textoVisitaPrincipal,
  type DashboardSupervisorData,
} from '../../services/dashboard.service'

export default function SupervisorDashboard() {
  const { user, logout } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dashboard, setDashboard] = useState<DashboardSupervisorData | null>(null)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const base = await obtenerDashboardBaseData()
        setDashboard(construirDashboardSupervisor(base))
      } catch (err) {
        console.error(err)
        setError('No se pudo cargar el dashboard de supervisión.')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [])

  const actionItems = useMemo(
    () => [
      { label: 'Nuevo cliente', href: '/portal/reportes?abrir=cliente&context=dashboard&from=supervisor', tone: 'primary' as const },
      { label: 'Nueva máquina', href: '/portal/reportes?abrir=maquina&context=dashboard&from=supervisor', tone: 'primary' as const },
      { label: 'Nuevo reporte', href: '/portal/reportes?abrir=crear&context=dashboard&from=supervisor', tone: 'primary' as const },
      { label: 'Solicitudes', targetId: 'sup-solicitudes' },
      { label: 'Visitas', targetId: 'sup-visitas' },
      { label: 'Reportes', targetId: 'sup-reportes' },
      { label: 'Resumen', targetId: 'sup-resumen' },
    ],
    []
  )

  return (
    <div className="portalShell roleShell">
      <header className="dashboardTopbar dashboardTopbarCompact">
        <div>
          <div className="topbarEyebrow">Portal interno · Supervisor</div>
          <h1>Centro de coordinación operativa</h1>
          <p>Vista enfocada en revisar entradas, monitorear visitas y detectar reportes pendientes.</p>
        </div>

        <button className="powerLogoutButton" type="button" onClick={logout}>
          <span className="powerIcon">⏻</span>
          <span>Cerrar sesión</span>
        </button>
      </header>

      <main className="dashboardContainer roleDashboardContainer">
        <RoleActionBar items={actionItems} />

        <section className="dashboardHero roleHeroCard" id="sup-resumen">
          <div className="dashboardHeroText">
            <span className="heroBadge">Supervisión</span>
            <h2>Flujo visible y accionable</h2>
            <p>
              {loading
                ? 'Cargando coordinación operativa...'
                : 'Se muestran datos reales para revisar solicitudes, monitorear visitas activas y validar cierres.'}
            </p>
          </div>

          <div className="dashboardUserCard">
            <strong>{user?.nombre}</strong>
            <span>{user?.email}</span>
            <div className="userRolePill">{user?.roleLabel}</div>
          </div>
        </section>

        {error && <div className="errorBox">{error}</div>}

        <section className="kpiGrid">
          {(dashboard?.metrics || []).map((metric) => (
            <article key={metric.label} className="kpiCard">
              <span className="kpiLabel">{metric.label}</span>
              <strong className="kpiValue">{metric.value}</strong>
              <p>{metric.hint}</p>
            </article>
          ))}
        </section>

        <section className="dashboardGrid roleDashboardGrid">
          <article className="moduleCard moduleCardWide" id="sup-solicitudes">
            <div className="moduleHeader">
              <div>
                <h3>Solicitudes por gestionar</h3>
                <p>Casos que deben revisarse, asignarse o convertirse en visita o actividad.</p>
              </div>
              <div className="statusPill">Acción operativa</div>
            </div>

            {dashboard?.solicitudesPorGestionar.length ? (
              <div className="dataList">
                {dashboard.solicitudesPorGestionar.map((solicitud) => (
                  <article key={solicitud.id} className="dataListItem">
                    <div>
                      <strong>Solicitud #{solicitud.id}</strong>
                      <p>
                        {solicitud.nombreSolicitante} · {textoSolicitudUbicacion(solicitud) || 'Ubicación pendiente'}
                      </p>
                    </div>
                    <div className="dataTags">
                      <span className="statusPill">{solicitud.tipoServicio || 'General'}</span>
                      <span className="statusPill">{solicitud.estado || 'NUEVA'}</span>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="emptyBlock">No hay solicitudes pendientes por gestionar.</div>
            )}
          </article>

          <article className="moduleCard" id="sup-visitas">
            <h3>Visitas pendientes</h3>
            {dashboard?.visitasPendientes.length ? (
              <div className="dataList smallList">
                {dashboard.visitasPendientes.map((visita) => (
                  <article key={visita.id} className="dataListItem compactItem">
                    <strong>{textoVisitaPrincipal(visita)}</strong>
                    <p>{visita.cliente?.nombre || 'Cliente pendiente'} · {visita.estado || 'PENDIENTE'}</p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="emptyBlock">No hay visitas activas pendientes.</div>
            )}
          </article>

          <article className="moduleCard" id="sup-reportes">
            <h3>Reportes sin cierre</h3>
            {dashboard?.reportesSinCierre.length ? (
              <div className="dataList smallList">
                {dashboard.reportesSinCierre.map((reporte) => (
                  <article key={reporte.id} className="dataListItem compactItem">
                    <strong>Reporte #{reporte.numeroReporte}</strong>
                    <p>{reporte.cliente?.nombre || 'Cliente'} · {reporte.estado || 'BORRADOR'}</p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="emptyBlock">No hay reportes pendientes de cierre.</div>
            )}
          </article>
        </section>
      </main>
    </div>
  )
}
