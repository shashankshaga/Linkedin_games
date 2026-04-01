import { useState, useEffect, useCallback } from 'react'
import { generateSudoku, isCellValid, getBoxIndex, Difficulty, SudokuPuzzle } from './sudokuLogic'
import { useTimer } from '../../hooks/useTimer'
import GameHeader from '../../components/GameHeader'
import WinModal from '../../components/WinModal'

interface Props { onBack: () => void }

const DIFF_LABELS: Record<Difficulty, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard' }
const DIFF_COLORS: Record<Difficulty, string> = { easy: '#5faa17', medium: '#e8910a', hard: '#cc1016' }

export default function SudokuGame({ onBack }: Props) {
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [puzzle, setPuzzle] = useState<SudokuPuzzle>(() => generateSudoku('medium'))
  const [userGrid, setUserGrid] = useState<number[][]>(() => puzzle.puzzle.map(r => [...r]))
  const [selected, setSelected] = useState<[number, number] | null>(null)
  const [solved, setSolved] = useState(false)
  const [generating, setGenerating] = useState(false)

  const { seconds, reset } = useTimer(!solved && !generating)

  const startNew = useCallback((diff?: Difficulty) => {
    const d = diff ?? difficulty
    setGenerating(true)
    setSelected(null)
    setSolved(false)
    // Defer heavy generation to next tick so UI updates first
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

  function selectCell(r: number, c: number) {
    if (puzzle.given[r][c]) return
    setSelected([r, c])
  }

  function inputNumber(n: number) {
    if (!selected) return
    const [r, c] = selected
    if (puzzle.given[r][c]) return
    const next = userGrid.map(row => [...row])
    next[r][c] = n
    setUserGrid(next)

    // Check win
    const win = next.every((row, ri) => row.every((v, ci) => v === puzzle.solution[ri][ci]))
    if (win) { setSolved(true); setSelected(null) }
  }

  // Keyboard
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (solved || generating) return
      if (!selected) return

      if (e.key >= '1' && e.key <= '9') { inputNumber(+e.key); return }
      if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') { inputNumber(0); return }

      const [r, c] = selected
      const dirs: Record<string, [number, number]> = {
        ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1]
      }
      if (dirs[e.key]) {
        const [dr, dc] = dirs[e.key]
        const nr = Math.max(0, Math.min(8, r + dr))
        const nc = Math.max(0, Math.min(8, c + dc))
        setSelected([nr, nc])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const { solution, given } = puzzle

  // Highlight: same number as selected
  const selVal = selected ? userGrid[selected[0]][selected[1]] : 0
  const selBox = selected ? getBoxIndex(selected[0], selected[1]) : -1

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: '#f3f2ef' }}>
      <GameHeader
        title="Sudoku"
        seconds={seconds}
        onBack={onBack}
        onNew={() => startNew()}
        extra={
          <div style={{
            display: 'inline-flex', borderRadius: 20, overflow: 'hidden',
            border: '1.5px solid #ddd', marginLeft: 6,
          }}>
            {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
              <button
                key={d}
                onClick={() => changeDifficulty(d)}
                style={{
                  padding: '4px 10px',
                  fontSize: 12, fontWeight: 600,
                  border: 'none',
                  background: difficulty === d ? DIFF_COLORS[d] : 'white',
                  color: difficulty === d ? 'white' : '#666',
                  transition: 'all 0.15s',
                }}
              >
                {DIFF_LABELS[d]}
              </button>
            ))}
          </div>
        }
      />

      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 12, gap: 16, overflowY: 'auto',
      }}>
        {generating ? (
          <div style={{ fontSize: 16, color: '#666' }}>Generating puzzle…</div>
        ) : (
          <>
            {/* Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(9, 1fr)',
              border: '3px solid #1d2226',
              borderRadius: 6,
              overflow: 'hidden',
              width: 'min(100%, 380px)',
            }}>
              {Array.from({ length: 9 }, (_, r) =>
                Array.from({ length: 9 }, (_, c) => {
                  const v = userGrid[r][c]
                  const isGiven = given[r][c]
                  const isSel = selected?.[0] === r && selected?.[1] === c
                  const isErr = !isGiven && v !== 0 && !isCellValid(userGrid, solution, r, c)
                  const isHighlight = selected && (
                    selected[0] === r || selected[1] === c || getBoxIndex(r, c) === selBox
                  )
                  const isSameNum = selVal > 0 && v === selVal && !isSel

                  const borderRight  = c < 8 ? (c % 3 === 2 ? '2.5px solid #1d2226' : '1px solid #ccc') : 'none'
                  const borderBottom = r < 8 ? (r % 3 === 2 ? '2.5px solid #1d2226' : '1px solid #ccc') : 'none'

                  let bg = '#fff'
                  if (isSel)        bg = '#bdd7f5'
                  else if (isHighlight) bg = '#e8f0fb'
                  if (isSameNum)    bg = '#c5dff5'

                  return (
                    <div
                      key={`${r}-${c}`}
                      onClick={() => selectCell(r, c)}
                      style={{
                        aspectRatio: '1',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 'clamp(14px, 4vw, 22px)',
                        fontWeight: isGiven ? 700 : 500,
                        color: isErr ? '#cc1016' : isGiven ? '#1d2226' : '#0a66c2',
                        background: isErr ? '#fff0f0' : bg,
                        borderRight, borderBottom,
                        cursor: isGiven ? 'default' : 'pointer',
                        transition: 'background 0.1s',
                        position: 'relative',
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
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: 8,
              width: 'min(100%, 320px)',
            }}>
              {[1,2,3,4,5,6,7,8,9].map(n => (
                <button
                  key={n}
                  onClick={() => inputNumber(n)}
                  style={{
                    aspectRatio: '1',
                    background: 'white',
                    border: '2px solid #ddd',
                    borderRadius: 10,
                    fontSize: 22, fontWeight: 700,
                    color: '#1d2226',
                    transition: 'all 0.1s',
                  }}
                  onMouseEnter={e => { (e.target as HTMLButtonElement).style.borderColor = '#0a66c2' }}
                  onMouseLeave={e => { (e.target as HTMLButtonElement).style.borderColor = '#ddd' }}
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => inputNumber(0)}
                style={{
                  aspectRatio: '1',
                  background: 'white',
                  border: '2px solid #ddd',
                  borderRadius: 10,
                  fontSize: 13, fontWeight: 600,
                  color: '#666',
                }}
              >
                DEL
              </button>
            </div>
          </>
        )}
      </div>

      {solved && (
        <WinModal
          gameName={`Sudoku — ${DIFF_LABELS[difficulty]}`}
          seconds={seconds}
          onNewGame={() => startNew()}
          onHome={onBack}
        />
      )}
    </div>
  )
}
