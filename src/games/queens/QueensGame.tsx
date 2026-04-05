import { useState } from 'react'
import { generateQueens, getConflicts, QueensPuzzle } from './queensLogic'
import { useTimer } from '../../hooks/useTimer'
import GameHeader, { ControlsBar, PrimaryBtn, GhostBtn } from '../../components/GameHeader'
import WinModal from '../../components/WinModal'

interface QueensSnapshot { board: boolean[][], hints: Set<string> }

interface Props { onBack: () => void }

const REGION_COLORS = [
  '#FF8A80', '#82B1FF', '#CCFF90', '#FFD180',
  '#EA80FC', '#80D8FF', '#F4FF81', '#FF80AB',
  '#A7FFEB', '#B9F6CA',
]

function newPuzzle() { return generateQueens(8) }

export default function QueensGame({ onBack }: Props) {
  const [puzzle, setPuzzle]       = useState<QueensPuzzle>(newPuzzle)
  const [board, setBoard]         = useState<boolean[][]>(() => Array.from({ length: 8 }, () => Array(8).fill(false)))
  const [hints, setHints]         = useState<Set<string>>(new Set())
  const [hintsUsed, setHintsUsed] = useState(0)
  const [history, setHistory]     = useState<QueensSnapshot[]>([])
  const [solved, setSolved]       = useState(false)

  const { seconds, reset } = useTimer(!solved)
  const MAX_HINTS = 3

  function saveSnapshot() {
    setHistory(h => [...h, { board: board.map(row => [...row]), hints: new Set(hints) }])
  }

  function undo() {
    if (history.length === 0) return
    const prev = history[history.length - 1]
    setBoard(prev.board)
    setHints(prev.hints)
    setHintsUsed(prev.hints.size)
    setHistory(h => h.slice(0, -1))
    setSolved(false)
  }

  function startNew() {
    setPuzzle(newPuzzle())
    setBoard(Array.from({ length: 8 }, () => Array(8).fill(false)))
    setHints(new Set())
    setHintsUsed(0)
    setHistory([])
    setSolved(false)
    reset()
  }

  function toggle(r: number, c: number) {
    if (solved) return
    if (hints.has(r + ',' + c)) return
    saveSnapshot()
    const next = board.map(row => [...row])
    next[r][c] = !next[r][c]
    setBoard(next)
    let count = 0
    for (let ri = 0; ri < puzzle.N; ri++)
      for (let ci = 0; ci < puzzle.N; ci++)
        if (next[ri][ci]) count++
    if (count === puzzle.N) {
      const { conflictRows, conflictCols, conflictCells } = getConflicts(next, puzzle.regions, puzzle.N)
      if (conflictRows.size === 0 && conflictCols.size === 0 && conflictCells.size === 0) setSolved(true)
    }
  }

  function applyHint() {
    if (hintsUsed >= MAX_HINTS) return
    const unplaced = puzzle.queens.filter(([r, c]) => !board[r][c])
    if (unplaced.length === 0) return
    saveSnapshot()
    const [r, c] = unplaced[Math.floor(Math.random() * unplaced.length)]
    const nextBoard = board.map(row => [...row])
    nextBoard[r][c] = true
    setBoard(nextBoard)
    setHints(prev => new Set([...prev, r + ',' + c]))
    setHintsUsed(h => h + 1)
  }

  const { N, regions } = puzzle
  const { conflictRows, conflictCols, conflictCells } = getConflicts(board, regions, N)

  let placed = 0
  for (let r = 0; r < N; r++)
    for (let c = 0; c < N; c++)
      if (board[r][c]) placed++

  const cellSize = Math.min(52, Math.floor((Math.min(window.innerWidth, 460) - 32) / N))
  const hasConflict = conflictRows.size > 0 || conflictCols.size > 0
  const hintsLeft = MAX_HINTS - hintsUsed

  const hintBtn = (
    <button
      onClick={applyHint}
      disabled={hintsUsed >= MAX_HINTS}
      style={{
        background: hintsUsed >= MAX_HINTS ? '#f0f0f0' : '#fff8e1',
        border: '2px solid ' + (hintsUsed >= MAX_HINTS ? '#ddd' : '#f9a825'),
        borderRadius: 22, padding: '7px 18px',
        fontSize: 13, fontWeight: 700,
        cursor: hintsUsed >= MAX_HINTS ? 'not-allowed' : 'pointer',
        color: hintsUsed >= MAX_HINTS ? '#bbb' : '#f57f17',
      }}
    >
      Hint ({hintsLeft} left)
    </button>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: '#f3f2ef' }}>
      <GameHeader
        title="Queens"
        seconds={seconds}
        onBack={onBack}
        badge={<span style={{ fontSize: 12, color: '#888' }}>{placed}/{N} queens</span>}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', overflowY: 'auto' }}>

        {/* Controls ABOVE grid */}
        <ControlsBar>
          <PrimaryBtn onClick={startNew}>New Game</PrimaryBtn>
          {hintBtn}
          <GhostBtn onClick={undo} color="#666">↩ Undo</GhostBtn>
        </ControlsBar>

        <p style={{ fontSize: 12, color: '#777', marginBottom: 10, textAlign: 'center', padding: '0 16px' }}>
          One queen per row, column and color region. Queens cannot touch.
        </p>

        {/* Grid */}
        <div
          className="no-select"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(' + N + ', ' + cellSize + 'px)',
            gridTemplateRows:    'repeat(' + N + ', ' + cellSize + 'px)',
            border: '3px solid #1d2226',
            borderRadius: 8,
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
          }}
        >
          {Array.from({ length: N }, (_, r) =>
            Array.from({ length: N }, (_, c) => {
              const reg        = regions[r][c]
              const baseColor  = REGION_COLORS[reg % REGION_COLORS.length]
              const hasQueen   = board[r][c]
              const isHint     = hints.has(r + ',' + c)
              const rowErr     = conflictRows.has(r)
              const colErr     = conflictCols.has(c)
              const cellErr    = conflictCells.has(r + ',' + c) && hasQueen
              const rightDiff  = c < N - 1 && regions[r][c + 1] !== reg
              const bottomDiff = r < N - 1 && regions[r + 1][c] !== reg

              let bg = baseColor
              if (rowErr || colErr) bg = 'linear-gradient(rgba(220,40,40,0.38), rgba(220,40,40,0.38)), ' + baseColor

              return (
                <div
                  key={r + '-' + c}
                  onClick={() => toggle(r, c)}
                  style={{
                    width: cellSize, height: cellSize,
                    background: bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: isHint ? 'default' : 'pointer',
                    position: 'relative',
                    borderRight:  c < N - 1 ? (rightDiff  ? '2.5px solid #1d2226' : '1px solid rgba(0,0,0,0.18)') : 'none',
                    borderBottom: r < N - 1 ? (bottomDiff ? '2.5px solid #1d2226' : '1px solid rgba(0,0,0,0.18)') : 'none',
                    boxSizing: 'border-box',
                    transition: 'background 0.1s',
                  }}
                >
                  {cellErr && (
                    <div style={{
                      position: 'absolute', inset: 0,
                      border: '3px solid #cc1016',
                      pointerEvents: 'none', zIndex: 2,
                    }} />
                  )}
                  {hasQueen && (
                    <span style={{
                      fontSize: cellSize * 0.50,
                      lineHeight: 1,
                      position: 'relative', zIndex: 1,
                      opacity: isHint ? 0.55 : 1,
                      filter: isHint
                        ? 'grayscale(0.4)'
                        : cellErr ? 'none' : 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))',
                    }}>
                      ♛
                    </span>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Conflict alert — BELOW the grid */}
        {hasConflict && (
          <div style={{
            marginTop: 12,
            background: '#fff0f0',
            border: '1.5px solid #ffaaaa',
            borderRadius: 10,
            padding: '8px 16px',
            fontSize: 13, color: '#cc1016', fontWeight: 600,
            textAlign: 'center',
          }}>
            Red = two queens share that row or column
          </div>
        )}

        {/* Controls BELOW grid */}
        <ControlsBar>
          <PrimaryBtn onClick={startNew}>New Game</PrimaryBtn>
          {hintBtn}
        </ControlsBar>

      </div>

      {solved && (
        <WinModal gameName="Queens" seconds={seconds} onNewGame={startNew} onHome={onBack} />
      )}
    </div>
  )
}
