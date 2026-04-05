import { useState, useRef, useCallback } from 'react'
import { generateZip, canMove, hasWall, ZipPuzzle, ZipDifficulty } from './zipLogic'
import { useTimer } from '../../hooks/useTimer'
import GameHeader, { ControlsBar, PrimaryBtn, GhostBtn } from '../../components/GameHeader'
import WinModal from '../../components/WinModal'

interface Props { onBack: () => void }

const DIFF_LABELS: Record<ZipDifficulty, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard' }
const DIFF_COLORS: Record<ZipDifficulty, string> = {
  easy: '#5faa17', medium: '#e8910a', hard: '#cc1016',
}

// Pure function — no side effects — safe to call inside setState updater
function tryExtend(
  r: number, c: number,
  path: [number, number][],
  puzzle: ZipPuzzle
): [number, number][] {
  if (path.length === 0) return path
  const [lr, lc] = path[path.length - 1]
  if (r === lr && c === lc) return path

  // Backtrack when stepping onto second-to-last cell
  if (path.length >= 2) {
    const [pr, pc] = path[path.length - 2]
    if (pr === r && pc === c) return path.slice(0, -1)
  }

  if (!canMove(lr, lc, r, c, puzzle.walls)) return path
  if (path.some(([pr, pc]) => pr === r && pc === c)) return path

  // Waypoint order: must visit waypoints in sequence
  const maxWP = path.reduce((m, [pr, pc]) => Math.max(m, puzzle.waypoints[pr][pc]), 0)
  const cellWP = puzzle.waypoints[r][c]
  if (cellWP > 0 && cellWP !== maxWP + 1) return path

  return [...path, [r, c] as [number, number]]
}

// Attempt to route through a diagonal move by inserting an intermediate step
function tryDiagonal(
  r: number, c: number,
  path: [number, number][],
  puzzle: ZipPuzzle
): [number, number][] {
  if (path.length === 0) return path
  const [lr, lc] = path[path.length - 1]
  const dr = Math.abs(r - lr), dc = Math.abs(c - lc)
  if (dr + dc <= 1) return tryExtend(r, c, path, puzzle) // normal move

  if (dr === 1 && dc === 1) {
    // Try horizontal-first intermediate: (lr, c)
    const hFirst = tryExtend(lr, c, path, puzzle)
    if (hFirst.length > path.length) {
      const both = tryExtend(r, c, hFirst, puzzle)
      if (both.length > hFirst.length) return both
      return hFirst
    }
    // Try vertical-first intermediate: (r, lc)
    const vFirst = tryExtend(r, lc, path, puzzle)
    if (vFirst.length > path.length) {
      const both = tryExtend(r, c, vFirst, puzzle)
      if (both.length > vFirst.length) return both
      return vFirst
    }
  }
  return path
}

export default function ZipGame({ onBack }: Props) {
  const [difficulty, setDifficulty] = useState<ZipDifficulty>('medium')
  const [puzzle, setPuzzle] = useState<ZipPuzzle>(() => generateZip('medium'))
  const [userPath, setUserPath] = useState<[number, number][]>([])
  const [pathHistory, setPathHistory] = useState<[number, number][][]>([])
  const [solved, setSolved] = useState(false)
  const drawing = useRef(false)
  const gridRef = useRef<HTMLDivElement>(null)
  const lastCell = useRef<string>('')

  const { seconds, reset } = useTimer(!solved)

  const startNew = useCallback((diff?: ZipDifficulty) => {
    const d = diff ?? difficulty
    setPuzzle(generateZip(d))
    setUserPath([])
    setPathHistory([])
    setSolved(false)
    drawing.current = false
    lastCell.current = ''
    reset()
  }, [difficulty, reset])

  function undo() {
    if (pathHistory.length === 0) {
      setUserPath([])
      return
    }
    setUserPath(pathHistory[pathHistory.length - 1])
    setPathHistory(h => h.slice(0, -1))
    setSolved(false)
  }

  function changeDiff(d: ZipDifficulty) {
    setDifficulty(d)
    startNew(d)
  }

  // Detect win after path update
  const checkWin = useCallback((path: [number, number][], pzl: ZipPuzzle) => {
    if (path.length !== pzl.R * pzl.C) return false
    let exp = 1
    for (const [pr, pc] of path) {
      const wp = pzl.waypoints[pr][pc]
      if (wp > 0) {
        if (wp !== exp) return false
        exp++
      }
    }
    return exp === pzl.numWaypoints + 1
  }, [])

  function getCellFromPoint(x: number, y: number): [number, number] | null {
    const grid = gridRef.current
    if (!grid) return null
    const rect = grid.getBoundingClientRect()
    // Clamp to grid bounds with 2px inset to avoid boundary noise
    const px = Math.max(2, Math.min(rect.width  - 2, x - rect.left))
    const py = Math.max(2, Math.min(rect.height - 2, y - rect.top))
    const c = Math.floor(px / (rect.width  / puzzle.C))
    const r = Math.floor(py / (rect.height / puzzle.R))
    if (r >= 0 && r < puzzle.R && c >= 0 && c < puzzle.C) return [r, c]
    return null
  }

  function handleCell(r: number, c: number) {
    const key = `${r},${c}`
    if (key === lastCell.current) return   // skip repeated same cell
    lastCell.current = key

    setUserPath(prev => {
      const next = tryDiagonal(r, c, prev, puzzle)
      if (next.length !== prev.length && checkWin(next, puzzle)) {
        // schedule outside the updater
        setTimeout(() => { drawing.current = false; setSolved(true) }, 0)
      }
      return next
    })
  }

  function onPointerDown(e: React.PointerEvent) {
    const cell = getCellFromPoint(e.clientX, e.clientY)
    if (!cell) return
    const [r, c] = cell
    if (puzzle.waypoints[r][c] === 1) {
      // Save snapshot before resetting path
      setPathHistory(h => [...h, userPath])
      drawing.current = true
      lastCell.current = `${r},${c}`
      setUserPath([[r, c]])
      setSolved(false)
    } else {
      setUserPath(prev => {
        const idx = prev.findIndex(([pr, pc]) => pr === r && pc === c)
        if (idx !== -1) {
          setPathHistory(h => [...h, prev])
          drawing.current = true
          lastCell.current = `${r},${c}`
          return prev.slice(0, idx + 1)
        }
        return prev
      })
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!drawing.current) return
    const cell = getCellFromPoint(e.clientX, e.clientY)
    if (cell) handleCell(cell[0], cell[1])
  }

  function onPointerUp() { drawing.current = false }

  const pathSet = new Map(userPath.map(([r, c], i) => [`${r},${c}`, i]))

  function isConnected(r1: number, c1: number, r2: number, c2: number) {
    const i1 = pathSet.get(`${r1},${c1}`)
    const i2 = pathSet.get(`${r2},${c2}`)
    if (i1 == null || i2 == null) return false
    return Math.abs(i1 - i2) === 1
  }

  const { R, C, waypoints, walls } = puzzle
  const CELL = 56

  const diffBar = (
    <div style={{ display: 'inline-flex', borderRadius: 20, overflow: 'hidden', border: '1.5px solid #ddd' }}>
      {(['easy', 'medium', 'hard'] as ZipDifficulty[]).map(d => (
        <button key={d} onClick={() => changeDiff(d)} style={{
          padding: '5px 12px', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer',
          background: difficulty === d ? DIFF_COLORS[d] : 'white',
          color: difficulty === d ? 'white' : '#666',
          transition: 'all 0.15s',
        }}>
          {DIFF_LABELS[d]}
        </button>
      ))}
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: '#f3f2ef' }}>
      <GameHeader
        title="Zip"
        seconds={seconds}
        onBack={onBack}
        badge={<span style={{ fontSize: 12, color: '#888' }}>{userPath.length}/{R * C} cells</span>}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', overflowY: 'auto' }}>

        {/* ── Controls ABOVE grid ── */}
        <ControlsBar>
          {diffBar}
          <GhostBtn onClick={() => startNew()}>New Game</GhostBtn>
          <GhostBtn onClick={undo} color="#666">↩ Undo</GhostBtn>
        </ControlsBar>

        <p style={{ fontSize: 12, color: '#777', marginBottom: 10, textAlign: 'center', padding: '0 16px' }}>
          Drag from <strong>①</strong> — visit every cell in order through the numbers
        </p>

        {/* ── Grid ── */}
        <div
          ref={gridRef}
          className="no-select"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${C}, ${CELL}px)`,
            gridTemplateRows:    `repeat(${R}, ${CELL}px)`,
            border: '3px solid #1d2226',
            borderRadius: 10,
            overflow: 'hidden',
            touchAction: 'none',
            cursor: 'crosshair',
          }}
        >
          {Array.from({ length: R }, (_, r) =>
            Array.from({ length: C }, (_, c) => {
              const key     = `${r},${c}`
              const pathIdx = pathSet.get(key)
              const inPath  = pathIdx != null
              const isHead  = inPath && pathIdx === userPath.length - 1
              const wp      = waypoints[r][c]

              const showTop    = inPath && r > 0     && isConnected(r, c, r - 1, c)
              const showBottom = inPath && r < R - 1 && isConnected(r, c, r + 1, c)
              const showLeft   = inPath && c > 0     && isConnected(r, c, r, c - 1)
              const showRight  = inPath && c < C - 1 && isConnected(r, c, r, c + 1)

              const wallTop    = hasWall(r, c, 'top',    walls, R, C)
              const wallRight  = hasWall(r, c, 'right',  walls, R, C)
              const wallBottom = hasWall(r, c, 'bottom', walls, R, C)
              const wallLeft   = hasWall(r, c, 'left',   walls, R, C)

              return (
                <div key={key} style={{
                  width: CELL, height: CELL,
                  background: inPath ? (isHead ? '#0a66c2' : '#d0e8ff') : '#fafafa',
                  position: 'relative',
                  borderTop:    r === 0     ? 'none' : wallTop    ? '3px solid #1d2226' : '1px solid #e0e0e0',
                  borderRight:  c === C - 1 ? 'none' : wallRight  ? '3px solid #1d2226' : '1px solid #e0e0e0',
                  borderBottom: r === R - 1 ? 'none' : wallBottom ? '3px solid #1d2226' : '1px solid #e0e0e0',
                  borderLeft:   c === 0     ? 'none' : wallLeft   ? '3px solid #1d2226' : '1px solid #e0e0e0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.05s',
                }}>
                  {showTop    && <div style={connStyle('top')} />}
                  {showBottom && <div style={connStyle('bottom')} />}
                  {showLeft   && <div style={connStyle('left')} />}
                  {showRight  && <div style={connStyle('right')} />}

                  {wp > 0 && (
                    <div style={{
                      position: 'relative', zIndex: 2,
                      width: 36, height: 36, borderRadius: '50%',
                      background: inPath ? '#004182' : '#0a66c2',
                      border: '2.5px solid white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontWeight: 700, fontSize: 15,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                    }}>
                      {wp}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* ── Controls BELOW grid ── */}
        <ControlsBar>
          <PrimaryBtn onClick={() => startNew()}>New Game</PrimaryBtn>
          <GhostBtn onClick={undo} color="#666">↩ Undo</GhostBtn>
          {diffBar}
        </ControlsBar>

      </div>

      {solved && (
        <WinModal gameName={`Zip — ${DIFF_LABELS[difficulty]}`} seconds={seconds} onNewGame={() => startNew()} onHome={onBack} />
      )}
    </div>
  )
}

function connStyle(side: 'top' | 'bottom' | 'left' | 'right'): React.CSSProperties {
  const base: React.CSSProperties = { position: 'absolute', background: '#4a90d9', zIndex: 1, borderRadius: 3 }
  if (side === 'top')    return { ...base, top: 0,    left: '50%', transform: 'translateX(-50%)', width: 14, height: '55%' }
  if (side === 'bottom') return { ...base, bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 14, height: '55%' }
  if (side === 'left')   return { ...base, left: 0,   top: '50%',  transform: 'translateY(-50%)', height: 14, width: '55%' }
  return                        { ...base, right: 0,  top: '50%',  transform: 'translateY(-50%)', height: 14, width: '55%' }
}
