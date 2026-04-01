export type Difficulty = 'easy' | 'medium' | 'hard'

export interface SudokuPuzzle {
  solution: number[][]
  puzzle: number[][]
  given: boolean[][]
  difficulty: Difficulty
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function isValid(grid: number[][], r: number, c: number, n: number): boolean {
  // Row
  if (grid[r].includes(n)) return false
  // Col
  if (grid.some(row => row[c] === n)) return false
  // Box
  const br = Math.floor(r / 3) * 3
  const bc = Math.floor(c / 3) * 3
  for (let dr = 0; dr < 3; dr++)
    for (let dc = 0; dc < 3; dc++)
      if (grid[br + dr][bc + dc] === n) return false
  return true
}

function getCandidates(grid: number[][], r: number, c: number): number[] {
  return [1,2,3,4,5,6,7,8,9].filter(n => isValid(grid, r, c, n))
}

function fillGrid(grid: number[][], pos = 0): boolean {
  if (pos === 81) return true
  const r = Math.floor(pos / 9), c = pos % 9
  for (const n of shuffle([1,2,3,4,5,6,7,8,9])) {
    if (isValid(grid, r, c, n)) {
      grid[r][c] = n
      if (fillGrid(grid, pos + 1)) return true
      grid[r][c] = 0
    }
  }
  return false
}

// Fast solver with MRV heuristic — stops at `limit` solutions
function countSolutions(grid: number[][], limit = 2): number {
  const g = grid.map(r => [...r])
  let count = 0

  function solve(): void {
    if (count >= limit) return

    // Find empty cell with fewest candidates (MRV)
    let minLen = 10, minR = -1, minC = -1
    outer: for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (g[r][c] !== 0) continue
        const len = getCandidates(g, r, c).length
        if (len === 0) return // dead end
        if (len < minLen) {
          minLen = len; minR = r; minC = c
          if (minLen === 1) break outer
        }
      }
    }

    if (minR === -1) { count++; return } // all filled

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
  easy: 32,
  medium: 45,
  hard: 55,
}

export function generateSudoku(difficulty: Difficulty): SudokuPuzzle {
  const solution = Array.from({ length: 9 }, () => Array(9).fill(0))
  fillGrid(solution)

  const puzzle = solution.map(r => [...r])
  const toRemove = REMOVE_COUNT[difficulty]

  const positions = shuffle(Array.from({ length: 81 }, (_, i) => i))
  let removed = 0

  for (const pos of positions) {
    if (removed >= toRemove) break
    const r = Math.floor(pos / 9), c = pos % 9
    const val = puzzle[r][c]
    puzzle[r][c] = 0
    if (countSolutions(puzzle) !== 1) {
      puzzle[r][c] = val // restore — removing broke uniqueness
    } else {
      removed++
    }
  }

  const given = puzzle.map(row => row.map(v => v !== 0))

  return { solution, puzzle, given, difficulty }
}

export function isCellValid(
  userGrid: number[][], solution: number[][], r: number, c: number
): boolean {
  const v = userGrid[r][c]
  return v === 0 || v === solution[r][c]
}

export function getBoxIndex(r: number, c: number): number {
  return Math.floor(r / 3) * 3 + Math.floor(c / 3)
}
