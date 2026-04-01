import { formatTime } from '../hooks/useTimer'

interface Props {
  title: string
  seconds: number
  onBack: () => void
  onNew: () => void
  extra?: React.ReactNode
}

export default function GameHeader({ title, seconds, onBack, onNew, extra }: Props) {
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
        fontSize: 20, padding: '4px 6px',
        color: '#0a66c2', fontWeight: 700,
      }}>←</button>

      <span style={{ fontWeight: 700, fontSize: 17 }}>{title}</span>

      {extra}

      <div style={{
        marginLeft: 'auto',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <div style={{
          background: '#f3f2ef',
          borderRadius: 20,
          padding: '4px 12px',
          fontFamily: 'monospace',
          fontSize: 16, fontWeight: 700,
          color: '#1d2226',
          minWidth: 60, textAlign: 'center',
        }}>
          {formatTime(seconds)}
        </div>
        <button onClick={onNew} style={{
          background: '#0a66c2', color: 'white',
          border: 'none', borderRadius: 20,
          padding: '6px 14px',
          fontSize: 13, fontWeight: 600,
        }}>
          New
        </button>
      </div>
    </div>
  )
}
