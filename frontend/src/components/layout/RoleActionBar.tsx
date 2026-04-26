import { Link } from 'react-router-dom'

type ActionItem = {
  label: string
  href?: string
  targetId?: string
  active?: boolean
  tone?: 'primary' | 'secondary' | 'ghost'
}

type Props = {
  items: ActionItem[]
}

function abrirSeccion(targetId?: string) {
  if (!targetId) return

  window.setTimeout(() => {
    const elemento = document.getElementById(targetId)
    if (!elemento) return

    if (elemento instanceof HTMLDetailsElement && !elemento.open) {
      const summary = elemento.querySelector('summary') as HTMLElement | null
      if (summary) summary.click()
      else elemento.open = true
    }

    elemento.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, 40)
}

export default function RoleActionBar({ items }: Props) {
  return (
    <nav className="roleActionBar" aria-label="Acciones del portal">
      {items.map((item) => {
        const tone = item.tone || (item.active ? 'primary' : 'secondary')
        const className =
          tone === 'primary'
            ? 'roleActionBtn roleActionBtnPrimary'
            : tone === 'ghost'
              ? 'roleActionBtn roleActionBtnGhost'
              : 'roleActionBtn'

        if (item.href) {
          return (
            <Link key={item.label} className={className} to={item.href}>
              {item.label}
            </Link>
          )
        }

        return (
          <a
            key={item.label}
            className={className}
            href={`#${item.targetId || ''}`}
            onClick={(event) => {
              event.preventDefault()
              abrirSeccion(item.targetId)
            }}
          >
            {item.label}
          </a>
        )
      })}
    </nav>
  )
}
