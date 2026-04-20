type Tone = 'success' | 'error' | 'warning' | 'info'

type Props = {
  open: boolean
  tone?: Tone
  title: string
  message: string
  onClose: () => void
}

const iconByTone: Record<Tone, string> = {
  success: '✓',
  error: '!',
  warning: '•',
  info: 'i',
}

export default function PortalNoticeModal({
  open,
  tone = 'info',
  title,
  message,
  onClose,
}: Props) {
  if (!open) return null

  return (
    <div className="noticeOverlay" role="dialog" aria-modal="true">
      <div className={`noticeCard notice-${tone}`}>
        <div className="noticeIcon">{iconByTone[tone]}</div>
        <div className="noticeBody">
          <h3>{title}</h3>
          <p>{message}</p>
        </div>
        <button className="noticeButton" type="button" onClick={onClose}>
          Aceptar
        </button>
      </div>
    </div>
  )
}
