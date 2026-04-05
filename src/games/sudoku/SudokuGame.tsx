import { useState, useEffect, useCallback } from 'react'
import {
  generateSudoku, isCellCorrect, getBoxIndex, getNumberCounts,
  Difficulty, SudokuPuzzle, SIZE, BOX_W, BOX_H,
} from './sudokuLogic'
import { useTimer } from '../../hooks/useTimer'
import GameHeader, { ControlsBar, PrimaryBtn, GhostBtn } from '../../components/GameHeader'
import WinModal from '../../components/WinModal'

interface Props { onBack: () => void }

const DIFF_LABELS: Record<Difficulty, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard' }
const DIFF_COLORS: Record<Difficulty, string> = {
  easy: '#5faa17', medium: '#e8910a', hard: '#cc1016',
}

export default function SudokuGame({ onBack }: Props) {
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [puzzle, setPuzzle]         = useState<SudokuPuzzle>(() => generateSudoku('medium'))
  const [userGrid, setUserGrid]     = useState<number[][]>(() => puzzle.puzzle.map(r => [...r]))
  const [history, setHistory]       = useState<number[][][]>([])
  const [selected, setSelected]     = useState<[number, number] | null>(null)
  const [solved, setSolved]         = useState(false)
  const [generating, setGenerating] = useState(false)

  const { seconds, reset } = useTimer(!solved && !generating)

  const startNew = useCallback((diff?: Difficulty) => {
    const d = diff ?? difficulty
    setGenerating(true)
    setSelected(null)
    setSolved(false)
    setHistory([])
    setTimeout(() => {
      const p = generateSudoku(d)
      setPuzzle(p)
      setUserGrid(p.puzzle.map(r => [...r]))
      setGenerating(false)
      reset()
    }, 30)
  }, [difficulty, reset])

  function changeDifficulty(d: Difficulty) {
    setDifficulty(d)
    startNew(d)
  }

  function inputNumber(n: number) {
    if (!selected) return
    const [r, c] = selected
    if (puzzle.given[r][c]) return
    if (n > 0 && counts[n] >= SIZE) return

    // Save snapshot before mutating
    setHistory(h => [...h, userGrid.map(row => [...row])])

    const next = userGrid.map(row => [...row])
    next[r][c] = n
    setUserGrid(next)

    const win = next.every((row, ri) => row.every((v, ci) => v === puzzle.solution[ri][ci]))
    if (win) { setSolved(true); setSelected(null) }
  }

  function undo() {
    if (history.length === 0) return
    setUserGrid(history[history.length - 1])
    setHistory(h => h.slice(0, -1))
    setSolved(false)
  }

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (generating) return
      if (e.key === 'z' && (e.ctrlKey || e.metaKey)) { undo(); return }
      if (solved) return
      const num = parseInt(e.key)
      if (num >= 1 && num <= 6) { inputNumber(num); return }
      if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') { inputNumber(0); return }
      if (!selected) return
      const [r, c] = selected
      const moves: Record<string, [number, number]> = {
        ArrowUp: [-1,0], ArrowDown: [1,0], ArrowLeft: [0,-1], ArrowRight: [0,1],
      }
      if (moves[e.key]) {
        const [dr, dc] = moves[e.key]
        setSelected([
          Math.max(0, Math.min(SIZE - 1, r + dr)),
          Math.max(0, Math.min(SIZE - 1, c + dc)),
        ])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const { solution, given } = puzzle
  const counts  = getNumberCounts(userGrid)
  const selVal  = selected ? userGrid[selected[0]][selected[1]] : 0
  const selBox  = selected ? getBoxIndex(selected[0], selected[1]) : -1

  const diffBar = (
    <div style={{ display: 'inline-flex', borderRadius: 20, overflow: 'hidden', border: '1.5px solid #ddd' }}>
      {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
        <button key={d} onClick={() => changeDifficulty(d)} style={{
          padding: '5px 10px', fontSize: 12, fontWeight: 700,
          border: 'none', cursor: 'pointer',
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
    /* outer: fixed height, overflow hidden so inner can scroll */
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden', background: '#f3f2ef' }}>
      <GameHeader title="Mini Sudoku" seconds={seconds} onBack={onBack} />

      {/* inner: scrollable column */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBottom: 24 }}>

        {/* Controls ABOVE */}
        <ControlsBar>
          {diffBar}
          <GhostBtn onClick={() => startNew()}>New</GhostBtn>
          <GhostBtn onClick={undo} color="#666">↩ Undo</GhostBtn>
        </ControlsBar>

        <p style={{ fontSize: 12, color: '#777', marginBottom: 8, textAlign: 'center', padding: '0 16px' }}>
          Each row, column &amp; bold box must contain 1–6
        </p>

        {generating ? (
          <div style={{ fontSize: 15, color: '#888', marginTop: 40 }}>Generating puzzle…</div>
        ) : (
          <>
            {/* Grid — capped so it + numpad always fit on screen */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${SIZE}, 1fr)`,
              width: 'min(88vw, 312px)',
              border: '3px solid #1d2226',
              borderRadius: 8,
              overflow: 'hidden',
              flexShrink: 0,
            }}>
              {Array.from({ length: SIZE }, (_, r) =>
                Array.from({ length: SIZE }, (_, c) => {
                  const v            = userGrid[r][c]
                  const isGiven      = given[r][c]
                  const isSel        = selected?.[0] === r && selected?.[1] === c
                  const isErr        = !isGiven && v !== 0 && !isCellCorrect(userGrid, solution, r, c)
                  const sameRowOrCol = selected && (selected[0] === r || selected[1] === c)
                  const sameBox      = selected && getBoxIndex(r, c) === selBox
                  const sameNum      = selVal > 0 && v === selVal && !isSel
                  const boldRight    = c === BOX_W - 1 && c < SIZE - 1
                  const boldBottom   = (r + 1) % BOX_H === 0 && r < SIZE - 1

                  let bg = '#fff'
                  if (isSel)                        bg = '#bdd7f5'
                  else if (sameNum)                 bg = '#c5dff5'
                  else if (sameRowOrCol || sameBox) bg = '#e8f0fb'

                  return (
                    <div
                      key={r + '-' + c}
                      onClick={() => { if (!isGiven) setSelected([r, c]); else setSelected(null) }}
                      style={{
                        aspectRatio: '1',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 'clamp(15px, 4.5vw, 22px)',
                        fontWeight: isGiven ? 800 : 500,
                        color: isErr ? '#cc1016' : isGiven ? '#1d2226' : '#0a66c2',
                        background: isErr ? '#fff0f0' : bg,
                        borderRight:  boldRight  ? '2.5px solid #1d2226' : c < SIZE - 1 ? '1px solid #ccc' : 'none',
                        borderBottom: boldBottom ? '2.5px solid #1d2226' : r < SIZE - 1 ? '1px solid #ccc' : 'none',
                        cursor: isGiven ? 'default' : 'pointer',
                        transition: 'background 0.08s',
                        boxSizing: 'border-box',
                      }}
                    >
                      {v || ''}
                    </div>
                  )
                })
              )}
            </div>

            {/* Numpad */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${SIZE}, 1fr)`,
              gap: 6,
              width: 'min(88vw, 312px)',
              marginTop: 12,
              flexShrink: 0,
            }}>
              {[1, 2, 3, 4, 5, 6].map(n => {
                const complete = counts[n] >= SIZE
                return (
                  <button key={n} onClick={() => inputNumber(n)} disabled={complete} style={{
                    height: 48,
                    background: complete ? '#f0f0f0' : 'white',
                    border: '2px solid ' + (complete ? '#ddd' : '#ccc'),
                    borderRadius: 10,
                    fontSize: 'clamp(15px, 4.5vw, 22px)',
                    fontWeight: 700,
                    color: complete ? '#bbb' : '#1d2226',
                    cursor: complete ? 'not-allowed' : 'pointer',
                    position: 'relative',
                    transition: 'all 0.1s',
                  }}>
                    {n}
                    {complete && (
                      <div style={{
                        position: 'absolute', inset: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 22, color: '#bbb',
                      }}>✓</div>
                    )}
                  </button>
                )
              })}
            </div>

            {/* DEL + Undo row */}
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexShrink: 0 }}>
              <button onClick={() => inputNumber(0)} style={{
                background: 'white', border: '2px solid #ccc', borderRadius: 10,
                padding: '8px 22px', fontSize: 13, fontWeight: 600, color: '#666', cursor: 'pointer',
              }}>
                ⌫ Delete
              </button>
              <button onClick={undo} disabled={history.length === 0} style={{
                background: history.length === 0 ? '#f5f5f5' : 'white',
                border: '2px solid ' + (history.length === 0 ? '#e0e0e0' : '#ccc'),
                borderRadius: 10,
                padding: '8px 22px', fontSize: 13, fontWeight: 600,
                color: history.length === 0 ? '#bbb' : '#444',
                cursor: history.length === 0 ? 'not-allowed' : 'pointer',
              }}>
                ↩ Undo
              </button>
            </div>
          </>
        )}

        {/* Controls BELOW */}
        <ControlsBar>
          <PrimaryBtn onClick={() => startNew()}>New Game</PrimaryBtn>
          {diffBar}
        </ControlsBar>

      </div>

      {solved && (
        <WinModal
          gameName={'Mini Sudoku — ' + DIFF_LABELS[difficulty]}
          seconds={seconds}
          onNewGame={() => startNew()}
          onHome={onBack}
        />
      )}
    </div>
  )
}
