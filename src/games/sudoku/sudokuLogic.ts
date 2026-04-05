export type Difficulty = 'easy' | 'medium' | 'hard'

export interface SudokuPuzzle {
  solution: number[][]
  puzzle: number[][]
  given: boolean[][]
  difficulty: Difficulty
}

// 6×6 grid, boxes are 3 wide × 2 tall
// Box arrangement: 2 columns of boxes × 3 rows of boxes
export const SIZE = 6
export const BOX_W = 3 // box width  (columns per box)
export const BOX_H = 2 // box height (rows per box)

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function getBoxIndex(r: number, c: number): number {
  // boxRow cycles every BOX_H rows, boxCol cycles every BOX_W cols
  return Math.floor(r / BOX_H) * (SIZE / BOX_W) + Math.floor(c / BOX_W)
}

function isValid(grid: number[][], r: number, c: number, n: number): boolean {
  if (grid[r].includes(n)) return false
  if (grid.some(row => row[c] === n)) return false
  const br = Math.floor(r / BOX_H) * BOX_H
  const bc = Math.floor(c / BOX_W) * BOX_W
  for (let dr = 0; dr < BOX_H; dr++)
    for (let dc = 0; dc < BOX_W; dc++)
      if (grid[br + dr][bc + dc] === n) return false
  return true
}

function getCandidates(grid: number[][], r: number, c: number): number[] {
  return [1, 2, 3, 4, 5, 6].filter(n => isValid(grid, r, c, n))
}

function fillGrid(grid: number[][], pos = 0): boolean {
  if (pos === SIZE * SIZE) return true
  const r = Math.floor(pos / SIZE), c = pos % SIZE
  for (const n of shuffle([1, 2, 3, 4, 5, 6])) {
    if (isValid(grid, r, c, n)) {
      grid[r][c] = n
      if (fillGrid(grid, pos + 1)) return true
      grid[r][c] = 0
    }
  }
  return false
}

function countSolutions(grid: number[][], limit = 2): number {
  const g = grid.map(r => [...r])
  let count = 0

  function solve(): void {
    if (count >= limit) return
    let minLen = 10, minR = -1, minC = -1
    outer: for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (g[r][c] !== 0) continue
        const cands = getCandidates(g, r, c)
        if (cands.length === 0) return
        if (cands.length < minLen) {
          minLen = cands.length; minR = r; minC = c
          if (minLen === 1) break outer
        }
      }
    }
    if (minR === -1) { count++; return }
    for (const n of getCandidates(g, minR, minC)) {
      g[minR][minC] = n
      solve()
      g[minR][minC] = 0
      if (count >= limit) return
    }
  }

  solve()
  return count
}

const REMOVE_COUNT: Record<Difficulty, number> = {
  easy:   12,
  medium: 18,
  hard:   23,
}

export function generateSudoku(difficulty: Difficulty): SudokuPuzzle {
  const solution = Array.from({ length: SIZE }, () => Array(SIZE).fill(0))
  fillGrid(solution)

  const puzzle = solution.map(r => [...r])
  const positions = shuffle(Array.from({ length: SIZE * SIZE }, (_, i) => i))
  let removed = 0

  for (const pos of positions) {
    if (removed >= REMOVE_COUNT[difficulty]) break
    const r = Math.floor(pos / SIZE), c = pos % SIZE
    const val = puzzle[r][c]
    puzzle[r][c] = 0
    if (countSolutions(puzzle) !== 1) {
      puzzle[r][c] = val
    } else {
      removed++
    }
  }

  return {
    solution,
    puzzle,
    given: puzzle.map(row => row.map(v => v !== 0)),
    difficulty,
  }
}

export function isCellCorrect(
  userGrid: number[][], solution: number[][], r: number, c: number
): boolean {
  const v = userGrid[r][c]
  return v === 0 || v === solution[r][c]
}

/** Count how many times each number 1-6 appears in the user grid */
export function getNumberCounts(userGrid: number[][]): Record<number, number> {
  const counts: Record<number, number> = { 1:0, 2:0, 3:0, 4:0, 5:0, 6:0 }
  for (const row of userGrid)
    for (const v of row)
      if (v >= 1 && v <= 6) counts[v]++
  return counts
}
