type Screen = 'zip' | 'sudoku' | 'queens'

interface Props { onNavigate: (s: Screen) => void }

const games = [
  {
    id: 'zip' as Screen,
    icon: '🔗',
    name: 'Zip',
    tagline: 'Trace a path through every cell — hit the numbers in order',
    iconBg: '#e8f0fb',
    badge: 'Blockers',
    badgeColor: '#0a66c2',
  },
  {
    id: 'sudoku' as Screen,
    icon: '🔢',
    name: 'Sudoku',
    tagline: '9×9 grid — Easy, Medium, or Hard. Unique puzzle every time.',
    iconBg: '#fdf0e0',
    badge: '3 Difficulties',
    badgeColor: '#e8910a',
  },
  {
    id: 'queens' as Screen,
    icon: '♛',
    name: 'Queens',
    tagline: 'One queen per row, column & color region. No touching.',
    iconBg: '#f0e8fb',
    badge: 'Row alerts',
    badgeColor: '#9c27b0',
  },
]

export default function HomeScreen({ onNavigate }: Props) {
  return (
    <div style={{
      minHeight: '100dvh',
      background: '#f3f2ef',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid #e8e8e8',
        padding: '14px 20px',
        display: 'flex', alignItems: 'center', gap: 12,
        boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
      }}>
        <div style={{
          width: 36, height: 36,
          background: '#0a66c2', borderRadius: 6,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontWeight: 900, fontSize: 20,
        }}>
          in
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>LinkedIn Games</div>
          <div style={{ fontSize: 12, color: '#888' }}>Unlimited • Auto-generated</div>
        </div>
      </div>

      {/* Content */}
      <div style={{
        flex: 1, maxWidth: 540, width: '100%',
        margin: '0 auto', padding: '24px 16px',
        display: 'flex', flexDirection: 'column', gap: 14,
      }}>
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700 }}>Choose a Puzzle</h2>
          <p style={{ color: '#666', fontSize: 14, marginTop: 6 }}>
            Every game is randomly generated — you'll never see the same puzzle twice.
          </p>
        </div>

        {games.map(g => (
          <div
            key={g.id}
            onClick={() => onNavigate(g.id)}
            style={{
              background: 'white',
              borderRadius: 16,
              padding: '18px 20px',
              display: 'flex', alignItems: 'center', gap: 16,
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              cursor: 'pointer',
              border: '2px solid transparent',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.borderColor = g.badgeColor
              ;(e.currentTarget as HTMLDivElement).style.boxShadow = `0 4px 16px rgba(0,0,0,0.13)`
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.borderColor = 'transparent'
              ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.08)'
            }}
          >
            <div style={{
              width: 58, height: 58, borderRadius: 14,
              background: g.iconBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, flexShrink: 0,
            }}>
              {g.icon}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontWeight: 700, fontSize: 18 }}>{g.name}</span>
                <span style={{
                  fontSize: 10, fontWeight: 700,
                  background: g.badgeColor + '18',
                  color: g.badgeColor,
                  padding: '2px 7px', borderRadius: 10,
                  border: `1px solid ${g.badgeColor}30`,
                }}>
                  {g.badge}
                </span>
              </div>
              <p style={{ fontSize: 13, color: '#666', lineHeight: 1.4 }}>{g.tagline}</p>
            </div>

            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: g.badgeColor,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: 18, flexShrink: 0,
            }}>
              →
            </div>
          </div>
        ))}

        <div style={{
          textAlign: 'center', fontSize: 12, color: '#aaa', marginTop: 8,
        }}>
          Timer • Tier rating (S→D) • Install as app on your phone
        </div>
      </div>
    </div>
  )
}
