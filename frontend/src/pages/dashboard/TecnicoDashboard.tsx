import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import RoleActionBar from '../../components/layout/RoleActionBar'
import {
  construirDashboardTecnico,
  obtenerDashboardBaseData,
  textoMaquinaVisita,
  textoVisitaPrincipal,
  type DashboardTecnicoData,
} from '../../services/dashboard.service'

export default function TecnicoDashboard() {
  const { user, logout } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dashboard, setDashboard] = useState<DashboardTecnicoData | null>(null)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const base = await obtenerDashboardBaseData()
        setDashboard(construirDashboardTecnico(base, user?.id || 0))
      } catch (err) {
        console.error(err)
        setError('No se pudo cargar el dashboard técnico.')
      } finally {
        setLoading(false)
      }
    }

    if (user?.id) {
      void load()
    }
  }, [user?.id])

  const actionItems = useMemo(
    () => [
      {
        label: 'Registrar máquina',
        href: '/portal/reportes?abrir=maquina&context=dashboard&from=tecnico',
        tone: 'primary' as const,
      },
      {
        label: 'Crear reporte',
        href: '/portal/reportes?abrir=crear&context=dashboard&from=tecnico',
        tone: 'primary' as const,
      },
      { label: 'Mis visitas', targetId: 'tec-visitas' },
      { label: 'Mis reportes', targetId: 'tec-reportes' },
      { label: 'Resumen', targetId: 'tec-resumen' },
    ],
    []
  )

  return (
    <div className="portalShell roleShell">
      <header className="dashboardTopbar dashboardTopbarCompact">
        <div>
          <div className="topbarEyebrow">Portal interno · Técnico</div>
          <h1>Mi operación técnica</h1>
          <p>
            Vista enfocada en reportar trabajo real. Si falta registrar un cliente nuevo, debe
            solicitarse al supervisor.
          </p>
        </div>

        <button className="powerLogoutButton" type="button" onClick={logout}>
          <span className="powerIcon">⏻</span>
          <span>Cerrar sesión</span>
        </button>
      </header>

      <main className="dashboardContainer roleDashboardContainer">
        <RoleActionBar items={actionItems} />

        <section className="dashboardHero roleHeroCard" id="tec-resumen">
          <div className="dashboardHeroText">
            <span className="heroBadge">Mi operación</span>
            <h2>Visitas y reportes ligados a mi usuario</h2>
            <p>
              {loading
                ? 'Cargando trabajo técnico...'
                : 'Desde aquí se trabaja con clientes existentes, se registran máquinas del servicio y se documenta el reporte.'}
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
          <article className="moduleCard moduleCardWide" id="tec-visitas">
            <div className="moduleHeader">
              <div>
                <h3>Mis visitas visibles</h3>
                <p>Lectura rápida de cliente, máquina principal y estado operativo.</p>
              </div>
              <div className="statusPill">Trabajo en campo</div>
            </div>

            {dashboard?.misVisitas.length ? (
              <div className="dataList">
                {dashboard.misVisitas.map((visita) => (
                  <article key={visita.id} className="dataListItem">
                    <div>
                      <strong>{textoVisitaPrincipal(visita)}</strong>
                      <p>{visita.cliente?.nombre || 'Cliente pendiente'} · {textoMaquinaVisita(visita)}</p>
                    </div>
                    <div className="dataTags">
                      <span className="statusPill">{visita.estado || 'PENDIENTE'}</span>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="emptyBlock">No hay visitas asignadas a tu usuario en la base actual.</div>
            )}
          </article>

          <article className="moduleCard" id="tec-reportes">
            <h3>Mis reportes recientes</h3>
            {dashboard?.misReportes.length ? (
              <div className="dataList smallList">
                {dashboard.misReportes.map((reporte) => (
                  <article key={reporte.id} className="dataListItem compactItem">
                    <strong>Reporte #{reporte.numeroReporte}</strong>
                    <p>{reporte.cliente?.nombre || 'Cliente'} · {reporte.estado || 'BORRADOR'}</p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="emptyBlock">Todavía no aparecen reportes asociados a tu usuario.</div>
            )}
          </article>
        </section>
      </main>
    </div>
  )
}