export interface QueensPuzzle {
  N: number
  queens: [number, number][]  // solution
  regions: number[][]         // N×N grid of region indices 0..N-1
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function placeQueens(N: number): [number, number][] | null {
  const cols: number[] = []

  function ok(row: number, col: number): boolean {
    for (let i = 0; i < row; i++) {
      if (cols[i] === col) return false
      // No touching (8 directions)
      if (Math.max(Math.abs(i - row), Math.abs(cols[i] - col)) <= 1) return false
    }
    return true
  }

  function bt(row: number): boolean {
    if (row === N) return true
    for (const c of shuffle(Array.from({ length: N }, (_, i) => i))) {
      if (ok(row, c)) {
        cols[row] = c
        if (bt(row + 1)) return true
      }
    }
    return false
  }

  for (let attempt = 0; attempt < 30; attempt++) {
    cols.length = 0
    if (bt(0)) return cols.map((c, r) => [r, c])
  }
  return null
}

function buildRegions(N: number, queens: [number, number][]): number[][] {
  const reg = Array.from({ length: N }, () => Array(N).fill(-1))
  const queues: [number, number][][] = queens.map(([r, c], i) => {
    reg[r][c] = i
    return [[r, c]]
  })
  const DIRS: [number, number][] = [[0,1],[1,0],[0,-1],[-1,0]]
  let assigned = N
  const total = N * N
  let safety = 0

  while (assigned < total && safety++ < 100000) {
    let progress = false
    for (let i = 0; i < N; i++) {
      if (!queues[i].length) continue
      const idx = Math.floor(Math.random() * queues[i].length)
      const [r, c] = queues[i].splice(idx, 1)[0]
      for (const [dr, dc] of DIRS) {
        const nr = r + dr, nc = c + dc
        if (nr >= 0 && nr < N && nc >= 0 && nc < N && reg[nr][nc] === -1) {
          reg[nr][nc] = i
          queues[i].push([nr, nc])
          assigned++
          progress = true
        }
      }
    }
    if (!progress) break
  }

  return reg
}

export function generateQueens(N = 8): QueensPuzzle {
  let queens: [number, number][] | null = null
  for (let i = 0; i < 50; i++) {
    queens = placeQueens(N)
    if (queens) break
  }
  if (!queens) return generateQueens(N) // retry

  const regions = buildRegions(N, queens)
  return { N, queens, regions }
}

export interface QueensConflicts {
  conflictRows: Set<number>
  conflictCols: Set<number>
  conflictCells: Set<string>  // cells that have queens in error
}

export function getConflicts(
  board: boolean[][],
  regions: number[][],
  N: number
): QueensConflicts {
  const placed: [number, number][] = []
  for (let r = 0; r < N; r++)
    for (let c = 0; c < N; c++)
      if (board[r][c]) placed.push([r, c])

  const rowCounts = new Map<number, number>()
  const colCounts = new Map<number, number>()
  const regCounts = new Map<number, number>()

  for (const [r, c] of placed) {
    rowCounts.set(r, (rowCounts.get(r) ?? 0) + 1)
    colCounts.set(c, (colCounts.get(c) ?? 0) + 1)
    const reg = regions[r][c]
    regCounts.set(reg, (regCounts.get(reg) ?? 0) + 1)
  }

  const conflictRows = new Set<number>()
  const conflictCols = new Set<number>()
  const conflictCells = new Set<string>()

  for (const [r, cnt] of rowCounts) if (cnt > 1) conflictRows.add(r)
  for (const [c, cnt] of colCounts) if (cnt > 1) conflictCols.add(c)

  for (let i = 0; i < placed.length; i++) {
    for (let j = i + 1; j < placed.length; j++) {
      const [r1, c1] = placed[i], [r2, c2] = placed[j]

      const sameReg = regions[r1][c1] === regions[r2][c2] &&
                      (regCounts.get(regions[r1][c1]) ?? 0) > 1
      const adjacent = Math.max(Math.abs(r1 - r2), Math.abs(c1 - c2)) <= 1

      if (sameReg || adjacent) {
        conflictCells.add(`${r1},${c1}`)
        conflictCells.add(`${r2},${c2}`)
      }
    }
  }

  return { conflictRows, conflictCols, conflictCells }
}
