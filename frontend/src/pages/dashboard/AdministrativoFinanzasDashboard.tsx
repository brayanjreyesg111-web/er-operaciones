import { useAuth } from '../../auth/AuthContext'
import RoleActionBar from '../../components/layout/RoleActionBar'

export default function AdministrativoFinanzasDashboard() {
  const { user, logout } = useAuth()

  return (
    <div className="portalShell roleShell">
      <header className="dashboardTopbar dashboardTopbarCompact">
        <div>
          <div className="topbarEyebrow">Portal interno · Administrativo / Finanzas</div>
          <h1>Bandeja administrativa</h1>
          <p>Vista base para expediente, cobro, facturación y control financiero del trabajo aprobado.</p>
        </div>

        <button className="powerLogoutButton" type="button" onClick={logout}>
          <span className="powerIcon">⏻</span>
          <span>Cerrar sesión</span>
        </button>
      </header>

      <main className="dashboardContainer roleDashboardContainer">
        <RoleActionBar
          items={[
            { label: 'Expedientes', targetId: 'admf-expedientes', active: true },
            { label: 'Cobro', targetId: 'admf-cobro' },
            { label: 'Calendario', targetId: 'admf-calendario' },
          ]}
        />

        <section className="dashboardHero roleHeroCard">
          <div className="dashboardHeroText">
            <span className="heroBadge">Etapa 1</span>
            <h2>Base lista para el módulo financiero</h2>
            <p>En esta etapa se deja el rol operativo y la vista base para continuar con cotización, cobro y facturación.</p>
          </div>

          <div className="dashboardUserCard">
            <strong>{user?.nombre}</strong>
            <span>{user?.email}</span>
            <div className="userRolePill">{user?.roleLabel}</div>
          </div>
        </section>

        <section className="dashboardGrid roleDashboardGrid">
          <article className="moduleCard" id="admf-expedientes">
            <h3>Expedientes por procesar</h3>
            <div className="emptyBlock">Aquí irán los trabajos aprobados listos para expediente documental.</div>
          </article>

          <article className="moduleCard" id="admf-cobro">
            <h3>Estado de cobro</h3>
            <div className="emptyBlock">Etapa 1 deja preparado el rol. En etapa 2 se conectará con estados: pendiente, parcial, pagado y retrasado.</div>
          </article>

          <article className="moduleCard" id="admf-calendario">
            <h3>Calendario financiero</h3>
            <div className="emptyBlock">Se deja la base visual para integrar calendario, facturación y reportes mensuales.</div>
          </article>
        </section>
      </main>
    </div>
  )
}
