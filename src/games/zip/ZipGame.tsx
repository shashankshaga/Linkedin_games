import { useState, useRef, useCallback } from 'react'
import { generateZip, canMove, hasWall, ZipPuzzle } from './zipLogic'
import { useTimer } from '../../hooks/useTimer'
import GameHeader from '../../components/GameHeader'
import WinModal from '../../components/WinModal'

interface Props { onBack: () => void }

function newPuzzle() { return generateZip(6, 6, 7) }

export default function ZipGame({ onBack }: Props) {
  const [puzzle, setPuzzle] = useState<ZipPuzzle>(newPuzzle)
  const [userPath, setUserPath] = useState<[number, number][]>([])
  const [solved, setSolved] = useState(false)
  const drawing = useRef(false)
  const gridRef = useRef<HTMLDivElement>(null)

  const { seconds, reset } = useTimer(!solved)

  function startNew() {
    setPuzzle(newPuzzle())
    setUserPath([])
    setSolved(false)
    reset()
  }

  const pathSet = new Map(userPath.map(([r, c], i) => [`${r},${c}`, i]))

  function isConnected(r1: number, c1: number, r2: number, c2: number) {
    const i1 = pathSet.get(`${r1},${c1}`)
    const i2 = pathSet.get(`${r2},${c2}`)
    if (i1 == null || i2 == null) return false
    return Math.abs(i1 - i2) === 1
  }

  function getCellFromPoint(x: number, y: number): [number, number] | null {
    const grid = gridRef.current
    if (!grid) return null
    const rect = grid.getBoundingClientRect()
    const cellW = rect.width / puzzle.C
    const cellH = rect.height / puzzle.R
    const c = Math.floor((x - rect.left) / cellW)
    const r = Math.floor((y - rect.top) / cellH)
    if (r >= 0 && r < puzzle.R && c >= 0 && c < puzzle.C) return [r, c]
    return null
  }

  const extendPath = useCallback((r: number, c: number, prevPath: [number, number][]) => {
    if (prevPath.length === 0) return prevPath
    const [lr, lc] = prevPath[prevPath.length - 1]
    if (r === lr && c === lc) return prevPath

    // Backtrack if stepping onto second-to-last
    if (prevPath.length >= 2) {
      const [pr, pc] = prevPath[prevPath.length - 2]
      if (pr === r && pc === c) return prevPath.slice(0, -1)
    }

    if (!canMove(lr, lc, r, c, puzzle.walls)) return prevPath
    if (prevPath.some(([pr, pc]) => pr === r && pc === c)) return prevPath

    // Waypoint order: if cell has a waypoint, must be next expected
    const maxWP = prevPath.reduce((m, [pr, pc]) => Math.max(m, puzzle.waypoints[pr][pc]), 0)
    const cellWP = puzzle.waypoints[r][c]
    if (cellWP > 0 && cellWP !== maxWP + 1) return prevPath

    const next = [...prevPath, [r, c] as [number, number]]

    // Check win
    if (next.length === puzzle.R * puzzle.C) {
      let exp = 1, ok = true
      for (const [pr, pc] of next) {
        const wp = puzzle.waypoints[pr][pc]
        if (wp > 0) { if (wp !== exp) { ok = false; break }; exp++ }
      }
      if (ok) {
        setUserPath(next)
        setSolved(true)
        drawing.current = false
        return next
      }
    }
    return next
  }, [puzzle])

  function onPointerDown(e: React.PointerEvent) {
    const cell = getCellFromPoint(e.clientX, e.clientY)
    if (!cell) return
    const [r, c] = cell
    if (puzzle.waypoints[r][c] === 1) {
      drawing.current = true
      setUserPath([[r, c]])
    } else {
      // Tap on path cell to backtrack
      const idx = userPath.findIndex(([pr, pc]) => pr === r && pc === c)
      if (idx !== -1) {
        drawing.current = true
        setUserPath(prev => prev.slice(0, idx + 1))
      }
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!drawing.current) return
    const cell = getCellFromPoint(e.clientX, e.clientY)
    if (!cell) return
    setUserPath(prev => {
      const next = extendPath(cell[0], cell[1], prev)
      return next
    })
  }

  function onPointerUp() { drawing.current = false }

  const CELL = 56 // px per cell
  const { R, C, waypoints, walls } = puzzle

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: '#f3f2ef' }}>
      <GameHeader
        title="Zip"
        seconds={seconds}
        onBack={onBack}
        onNew={startNew}
        extra={
          <span style={{ fontSize: 13, color: '#666', marginLeft: 4 }}>
            {userPath.length}/{R * C} cells
          </span>
        }
      />

      <div style={{
        flex: 1,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 16, gap: 14,
        overflowY: 'auto',
      }}>
        <p style={{ fontSize: 13, color: '#555', textAlign: 'center' }}>
          Drag from <strong>①</strong> — visit every cell hitting numbers in order
        </p>

        {/* Grid */}
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
            gridTemplateRows: `repeat(${R}, ${CELL}px)`,
            border: '3px solid #1d2226',
            borderRadius: 10,
            overflow: 'hidden',
            touchAction: 'none',
            cursor: 'crosshair',
          }}
        >
          {Array.from({ length: R }, (_, r) =>
            Array.from({ length: C }, (_, c) => {
              const key = `${r},${c}`
              const pathIdx = pathSet.get(key)
              const inPath = pathIdx != null
              const isHead = inPath && pathIdx === userPath.length - 1
              const wp = waypoints[r][c]

              const showTop    = inPath && r > 0 && isConnected(r, c, r - 1, c)
              const showBottom = inPath && r < R - 1 && isConnected(r, c, r + 1, c)
              const showLeft   = inPath && c > 0 && isConnected(r, c, r, c - 1)
              const showRight  = inPath && c < C - 1 && isConnected(r, c, r, c + 1)

              const wallTop    = hasWall(r, c, 'top', walls, R, C)
              const wallRight  = hasWall(r, c, 'right', walls, R, C)
              const wallBottom = hasWall(r, c, 'bottom', walls, R, C)
              const wallLeft   = hasWall(r, c, 'left', walls, R, C)

              return (
                <div
                  key={key}
                  style={{
                    width: CELL, height: CELL,
                    background: inPath ? (isHead ? '#0a66c2' : '#d0e8ff') : '#fafafa',
                    position: 'relative',
                    borderTop:    r === 0 ? 'none' : wallTop    ? '3px solid #1d2226' : '1px solid #ddd',
                    borderRight:  c === C - 1 ? 'none' : wallRight  ? '3px solid #1d2226' : '1px solid #ddd',
                    borderBottom: r === R - 1 ? 'none' : wallBottom ? '3px solid #1d2226' : '1px solid #ddd',
                    borderLeft:   c === 0 ? 'none' : wallLeft   ? '3px solid #1d2226' : '1px solid #ddd',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background 0.05s',
                  }}
                >
                  {/* Path connectors */}
                  {showTop    && <div style={conn('top')} />}
                  {showBottom && <div style={conn('bottom')} />}
                  {showLeft   && <div style={conn('left')} />}
                  {showRight  && <div style={conn('right')} />}

                  {/* Waypoint dot */}
                  {wp > 0 && (
                    <div style={{
                      position: 'relative', zIndex: 2,
                      width: 36, height: 36,
                      borderRadius: '50%',
                      background: inPath ? '#004182' : '#0a66c2',
                      border: '2px solid white',
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
      </div>

      {solved && (
        <WinModal
          gameName="Zip"
          seconds={seconds}
          onNewGame={startNew}
          onHome={onBack}
        />
      )}
    </div>
  )
}

function conn(side: 'top' | 'bottom' | 'left' | 'right'): React.CSSProperties {
  const base: React.CSSProperties = {
    position: 'absolute',
    background: '#4a90d9',
    zIndex: 1,
    borderRadius: 4,
  }
  if (side === 'top')    return { ...base, top: 0, left: '50%', transform: 'translateX(-50%)', width: 14, height: '55%' }
  if (side === 'bottom') return { ...base, bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 14, height: '55%' }
  if (side === 'left')   return { ...base, left: 0, top: '50%', transform: 'translateY(-50%)', height: 14, width: '55%' }
  return { ...base, right: 0, top: '50%', transform: 'translateY(-50%)', height: 14, width: '55%' }
}
