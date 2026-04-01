import { useState } from 'react'
import { generateQueens, getConflicts, QueensPuzzle } from './queensLogic'
import { useTimer } from '../../hooks/useTimer'
import GameHeader from '../../components/GameHeader'
import WinModal from '../../components/WinModal'

interface Props { onBack: () => void }

// Distinct, accessible color palette for regions
const REGION_COLORS = [
  '#FF8A80', '#82B1FF', '#CCFF90', '#FFD180',
  '#EA80FC', '#80D8FF', '#F4FF81', '#FF80AB',
  '#A7FFEB', '#B9F6CA',
]

function newPuzzle() { return generateQueens(8) }

export default function QueensGame({ onBack }: Props) {
  const [puzzle, setPuzzle] = useState<QueensPuzzle>(newPuzzle)
  const [board, setBoard] = useState<boolean[][]>(
    () => Array.from({ length: 8 }, () => Array(8).fill(false))
  )
  const [solved, setSolved] = useState(false)

  const { seconds, reset } = useTimer(!solved)

  function startNew() {
    setPuzzle(newPuzzle())
    setBoard(Array.from({ length: 8 }, () => Array(8).fill(false)))
    setSolved(false)
    reset()
  }

  function toggle(r: number, c: number) {
    if (solved) return
    const next = board.map(row => [...row])
    next[r][c] = !next[r][c]
    setBoard(next)

    // Win check
    let count = 0
    for (let ri = 0; ri < puzzle.N; ri++)
      for (let ci = 0; ci < puzzle.N; ci++)
        if (next[ri][ci]) count++

    if (count === puzzle.N) {
      const { conflictRows, conflictCols, conflictCells } = getConflicts(next, puzzle.regions, puzzle.N)
      if (conflictRows.size === 0 && conflictCols.size === 0 && conflictCells.size === 0) {
        setSolved(true)
      }
    }
  }

  const { N, regions } = puzzle
  const { conflictRows, conflictCols, conflictCells } = getConflicts(board, regions, N)

  // Count placed queens
  let placed = 0
  for (let r = 0; r < N; r++)
    for (let c = 0; c < N; c++)
      if (board[r][c]) placed++

  const cellSize = Math.min(52, Math.floor((Math.min(window.innerWidth, 460) - 40) / N))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: '#f3f2ef' }}>
      <GameHeader
        title="Queens"
        seconds={seconds}
        onBack={onBack}
        onNew={startNew}
        extra={
          <span style={{ fontSize: 13, color: '#666', marginLeft: 4 }}>
            {placed}/{N} placed
          </span>
        }
      />

      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'flex-start',
        padding: '12px 16px', gap: 12, overflowY: 'auto',
      }}>
        <p style={{ fontSize: 13, color: '#555', textAlign: 'center', lineHeight: 1.4 }}>
          Place one ♛ per <strong>row</strong>, <strong>column</strong> &amp; <strong>color</strong>.
          No two queens may touch.
        </p>

        {/* Conflict legend */}
        {(conflictRows.size > 0 || conflictCols.size > 0) && (
          <div style={{
            background: '#fff0f0', border: '1.5px solid #ffaaaa',
            borderRadius: 8, padding: '6px 12px',
            fontSize: 12, color: '#cc1016', fontWeight: 600,
          }}>
            🚨 Red row/column = two queens share that line
          </div>
        )}

        {/* Grid */}
        <div
          className="no-select"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${N}, ${cellSize}px)`,
            gridTemplateRows: `repeat(${N}, ${cellSize}px)`,
            border: '3px solid #1d2226',
            borderRadius: 8,
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          }}
        >
          {Array.from({ length: N }, (_, r) =>
            Array.from({ length: N }, (_, c) => {
              const reg = regions[r][c]
              const baseColor = REGION_COLORS[reg % REGION_COLORS.length]
              const hasQueen = board[r][c]
              const rowConflict = conflictRows.has(r)
              const colConflict = conflictCols.has(c)
              const cellConflict = conflictCells.has(`${r},${c}`) && hasQueen

              // Whole row/col highlight overrides region color
              let bg = baseColor
              if (rowConflict || colConflict) {
                // Blend region color with red
                bg = `linear-gradient(rgba(220,50,50,0.40), rgba(220,50,50,0.40)), ${baseColor}`
              }

              return (
                <div
                  key={`${r}-${c}`}
                  onClick={() => toggle(r, c)}
                  style={{
                    width: cellSize, height: cellSize,
                    background: bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: cellSize * 0.5,
                    cursor: 'pointer',
                    position: 'relative',
                    borderRight:  c < N - 1 ? '1px solid rgba(0,0,0,0.15)' : 'none',
                    borderBottom: r < N - 1 ? '1px solid rgba(0,0,0,0.15)' : 'none',
                    transition: 'background 0.1s',
                    boxSizing: 'border-box',
                  }}
                >
                  {/* Error outline on queen cell */}
                  {cellConflict && (
                    <div style={{
                      position: 'absolute', inset: 0,
                      border: '3px solid #cc1016',
                      pointerEvents: 'none',
                      zIndex: 2,
                    }} />
                  )}
                  {hasQueen && (
                    <span style={{
                      position: 'relative', zIndex: 1,
                      filter: cellConflict ? 'none' : 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))',
                      fontSize: cellSize * 0.52,
                      lineHeight: 1,
                    }}>
                      ♛
                    </span>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Color legend */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 6,
          justifyContent: 'center', maxWidth: 400,
        }}>
          {Array.from({ length: N }, (_, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 14, height: 14, borderRadius: 3,
                background: REGION_COLORS[i % REGION_COLORS.length],
                border: '1px solid rgba(0,0,0,0.2)',
              }} />
              <span style={{ fontSize: 11, color: '#555' }}>Region {i + 1}</span>
            </div>
          ))}
        </div>
      </div>

      {solved && (
        <WinModal
          gameName="Queens"
          seconds={seconds}
          onNewGame={startNew}
          onHome={onBack}
        />
      )}
    </div>
  )
}
