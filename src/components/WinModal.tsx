import { formatTime } from '../hooks/useTimer'

interface Props {
  gameName: string
  seconds: number
  onNewGame: () => void
  onHome: () => void
}

const tiers = [
  { max: 60,  label: 'S', color: '#FFD700', bg: '#fffbe6' },
  { max: 120, label: 'A', color: '#0a66c2', bg: '#e8f0fb' },
  { max: 240, label: 'B', color: '#5faa17', bg: '#e6f3d0' },
  { max: 480, label: 'C', color: '#e8910a', bg: '#fdf3e0' },
  { max: Infinity, label: 'D', color: '#666',    bg: '#f0f0f0' },
]

function getTier(s: number) {
  return tiers.find(t => s <= t.max)!
}

export default function WinModal({ gameName, seconds, onNewGame, onHome }: Props) {
  const tier = getTier(seconds)

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 200, padding: 20,
    }}>
      <div style={{
        background: 'white',
        borderRadius: 20,
        padding: '36px 32px',
        maxWidth: 340,
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 8px 40px rgba(0,0,0,0.25)',
      }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Puzzle Solved!</h2>
        <p style={{ color: '#666', fontSize: 14, marginBottom: 24 }}>{gameName}</p>

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24,
          marginBottom: 28,
        }}>
          <div>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>TIME</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#1d2226' }}>
              {formatTime(seconds)}
            </div>
          </div>
          <div style={{
            width: 72, height: 72,
            borderRadius: 16,
            background: tier.bg,
            border: `3px solid ${tier.color}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column',
          }}>
            <div style={{ fontSize: 32, fontWeight: 900, color: tier.color, lineHeight: 1 }}>
              {tier.label}
            </div>
            <div style={{ fontSize: 10, color: tier.color, fontWeight: 600 }}>TIER</div>
          </div>
        </div>

        <div style={{
          background: '#f8f8f8', borderRadius: 10, padding: '10px 14px',
          marginBottom: 24, fontSize: 12, color: '#666',
        }}>
          S ≤1min · A ≤2min · B ≤4min · C ≤8min · D 8min+
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onHome} style={{
            flex: 1, padding: '12px 0',
            border: '2px solid #0a66c2', borderRadius: 24,
            background: 'white', color: '#0a66c2',
            fontSize: 15, fontWeight: 600,
          }}>
            Home
          </button>
          <button onClick={onNewGame} style={{
            flex: 1, padding: '12px 0',
            border: 'none', borderRadius: 24,
            background: '#0a66c2', color: 'white',
            fontSize: 15, fontWeight: 600,
          }}>
            New Game
          </button>
        </div>
      </div>
    </div>
  )
}
