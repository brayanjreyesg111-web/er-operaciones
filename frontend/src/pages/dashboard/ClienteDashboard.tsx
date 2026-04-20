import { useAuth } from '../../auth/AuthContext'
import RoleActionBar from '../../components/layout/RoleActionBar'

export default function ClienteDashboard() {
  const { user, logout } = useAuth()

  return (
    <div className="portalShell roleShell">
      <header className="dashboardTopbar dashboardTopbarCompact">
        <div>
          <div className="topbarEyebrow">Portal interno · Cliente</div>
          <h1>Mi seguimiento</h1>
          <p>Vista base para solicitudes, visitas autorizadas y reportes visibles del cliente.</p>
        </div>

        <button className="powerLogoutButton" type="button" onClick={logout}>
          <span className="powerIcon">⏻</span>
          <span>Cerrar sesión</span>
        </button>
      </header>

      <main className="dashboardContainer roleDashboardContainer">
        <RoleActionBar
          items={[
            { label: 'Solicitudes', targetId: 'cli-solicitudes', active: true },
            { label: 'Visitas', targetId: 'cli-visitas' },
            { label: 'Reportes', targetId: 'cli-reportes' },
          ]}
        />

        <section className="dashboardHero roleHeroCard">
          <div className="dashboardHeroText">
            <span className="heroBadge">Etapa 1</span>
            <h2>Portal cliente base</h2>
            <p>Se deja la base del rol cliente para que luego se conecte con solicitudes, visitas programadas y reportes autorizados.</p>
          </div>

          <div className="dashboardUserCard">
            <strong>{user?.nombre}</strong>
            <span>{user?.email}</span>
            <div className="userRolePill">{user?.roleLabel}</div>
          </div>
        </section>

        <section className="dashboardGrid roleDashboardGrid">
          <article className="moduleCard" id="cli-solicitudes">
            <h3>Mis solicitudes</h3>
            <div className="emptyBlock">En la siguiente etapa aquí se listarán las solicitudes visibles del cliente.</div>
          </article>

          <article className="moduleCard" id="cli-visitas">
            <h3>Mis visitas</h3>
            <div className="emptyBlock">Aquí aparecerán las visitas autorizadas o programadas para el cliente.</div>
          </article>

          <article className="moduleCard" id="cli-reportes">
            <h3>Mis reportes</h3>
            <div className="emptyBlock">Aquí aparecerán los reportes autorizados para descarga o consulta.</div>
          </article>
        </section>
      </main>
    </div>
  )
}
