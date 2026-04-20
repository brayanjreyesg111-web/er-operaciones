import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import RoleActionBar from '../../components/layout/RoleActionBar'
import {
  construirDashboardAdmin,
  obtenerDashboardBaseData,
  textoSolicitudUbicacion,
  textoVisitaPrincipal,
  type DashboardAdminData,
} from '../../services/dashboard.service'

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dashboard, setDashboard] = useState<DashboardAdminData | null>(null)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const base = await obtenerDashboardBaseData()
        setDashboard(construirDashboardAdmin(base))
      } catch (err) {
        console.error(err)
        setError('No se pudo cargar el dashboard administrativo.')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [])

  const actionItems = useMemo(
    () => [
      { label: 'Nuevo cliente', href: '/portal/reportes?abrir=cliente&context=dashboard&from=admin', tone: 'primary' as const },
      { label: 'Nueva máquina', href: '/portal/reportes?abrir=maquina&context=dashboard&from=admin', tone: 'primary' as const },
      { label: 'Nuevo reporte', href: '/portal/reportes?abrir=crear&context=dashboard&from=admin', tone: 'primary' as const },
      { label: 'Solicitudes', targetId: 'admin-solicitudes' },
      { label: 'Visitas', targetId: 'admin-visitas' },
      { label: 'Reportes', targetId: 'admin-reportes' },
      { label: 'Resumen', targetId: 'admin-resumen' },
    ],
    []
  )

  return (
    <div className="portalShell roleShell">
      <header className="dashboardTopbar dashboardTopbarCompact">
        <div>
          <div className="topbarEyebrow">Portal interno · Administración</div>
          <h1>Centro administrativo</h1>
          <p>Control rápido de solicitudes, visitas, reportes y catálogos operativos.</p>
        </div>

        <button className="powerLogoutButton" type="button" onClick={logout}>
          <span className="powerIcon">⏻</span>
          <span>Cerrar sesión</span>
        </button>
      </header>

      <main className="dashboardContainer roleDashboardContainer">
        <RoleActionBar items={actionItems} />

        <section className="dashboardHero roleHeroCard" id="admin-resumen">
          <div className="dashboardHeroText">
            <span className="heroBadge">Control total</span>
            <h2>Operación visible y ordenada</h2>
            <p>
              {loading
                ? 'Cargando métricas del sistema...'
                : 'Se muestran datos reales para priorizar solicitudes, validar visitas y revisar reportes emitidos.'}
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
          <article className="moduleCard moduleCardWide" id="admin-solicitudes">
            <div className="moduleHeader">
              <div>
                <h3>Solicitudes recientes</h3>
                <p>Entradas del portal público listas para revisión administrativa.</p>
              </div>
              <div className="statusPill">{dashboard?.solicitudesRecientes.length || 0} visibles</div>
            </div>

            {dashboard?.solicitudesRecientes.length ? (
              <div className="dataList">
                {dashboard.solicitudesRecientes.map((solicitud) => (
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
              <div className="emptyBlock">Todavía no hay solicitudes visibles.</div>
            )}
          </article>

          <article className="moduleCard" id="admin-visitas">
            <h3>Visitas recientes</h3>
            {dashboard?.visitasRecientes.length ? (
              <div className="dataList smallList">
                {dashboard.visitasRecientes.map((visita) => (
                  <article key={visita.id} className="dataListItem compactItem">
                    <strong>{textoVisitaPrincipal(visita)}</strong>
                    <p>{visita.cliente?.nombre || 'Cliente pendiente'} · {visita.estado || 'PENDIENTE'}</p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="emptyBlock">Todavía no hay visitas cargadas.</div>
            )}
          </article>

          <article className="moduleCard" id="admin-reportes">
            <h3>Reportes recientes</h3>
            {dashboard?.reportesRecientes.length ? (
              <div className="dataList smallList">
                {dashboard.reportesRecientes.map((reporte) => (
                  <article key={reporte.id} className="dataListItem compactItem">
                    <strong>Reporte #{reporte.numeroReporte}</strong>
                    <p>{reporte.cliente?.nombre || 'Cliente'} · {reporte.estado || 'BORRADOR'}</p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="emptyBlock">No hay reportes visibles en este momento.</div>
            )}
          </article>
        </section>
      </main>
    </div>
  )
}
