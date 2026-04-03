import { formatTime } from '../hooks/useTimer'

interface Props {
  title: string
  seconds: number
  onBack: () => void
  badge?: React.ReactNode
}

export default function GameHeader({ title, seconds, onBack, badge }: Props) {
  return (
    <div style={{
      background: 'white',
      borderBottom: '1px solid #e8e8e8',
      padding: '10px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
    }}>
      <button onClick={onBack} style={{
        background: 'none', border: 'none',
        fontSize: 22, padding: '2px 6px',
        color: '#0a66c2', fontWeight: 700, cursor: 'pointer',
      }}>←</button>

      <span style={{ fontWeight: 700, fontSize: 17 }}>{title}</span>

      {badge && <div style={{ marginLeft: 4 }}>{badge}</div>}

      <div style={{
        marginLeft: 'auto',
        background: '#f3f2ef',
        borderRadius: 20,
        padding: '5px 14px',
        fontFamily: 'monospace',
        fontSize: 18, fontWeight: 700,
        color: '#1d2226',
        minWidth: 70, textAlign: 'center',
        letterSpacing: 1,
      }}>
        {formatTime(seconds)}
      </div>
    </div>
  )
}

// Reusable button strips used above/below grids
export function ControlsBar({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: 10, flexWrap: 'wrap',
      padding: '10px 16px',
    }}>
      {children}
    </div>
  )
}

export function PrimaryBtn({
  onClick, children, color = '#0a66c2',
}: {
  onClick: () => void
  children: React.ReactNode
  color?: string
}) {
  return (
    <button onClick={onClick} style={{
      background: color, color: 'white',
      border: 'none', borderRadius: 22,
      padding: '9px 22px',
      fontSize: 14, fontWeight: 700,
      cursor: 'pointer',
      boxShadow: `0 2px 8px ${color}55`,
      transition: 'opacity 0.15s',
    }}
      onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
      onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
    >
      {children}
    </button>
  )
}

export function GhostBtn({
  onClick, children, color = '#0a66c2',
}: {
  onClick: () => void
  children: React.ReactNode
  color?: string
}) {
  return (
    <button onClick={onClick} style={{
      background: 'white', color,
      border: `2px solid ${color}`,
      borderRadius: 22,
      padding: '7px 20px',
      fontSize: 14, fontWeight: 700,
      cursor: 'pointer',
      transition: 'all 0.15s',
    }}
      onMouseEnter={e => { e.currentTarget.style.background = color; e.currentTarget.style.color = 'white' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = color }}
    >
      {children}
    </button>
  )
}
