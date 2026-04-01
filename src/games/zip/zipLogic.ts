export interface ZipPuzzle {
  R: number
  C: number
  waypoints: number[][] // grid[r][c] = waypoint number (0 = none)
  walls: Set<string>    // "h-r-c" (right of (r,c)) | "v-r-c" (below (r,c))
  solution: [number, number][]
  numWaypoints: number
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function generateHamiltonianPath(R: number, C: number): [number, number][] {
  const vis = Array.from({ length: R }, () => Array(C).fill(false))
  const path: [number, number][] = []
  const DIRS: [number, number][] = [[0,1],[1,0],[0,-1],[-1,0]]

  function dfs(r: number, c: number): boolean {
    vis[r][c] = true
    path.push([r, c])
    if (path.length === R * C) return true
    for (const [dr, dc] of shuffle(DIRS)) {
      const nr = r + dr, nc = c + dc
      if (nr >= 0 && nr < R && nc >= 0 && nc < C && !vis[nr][nc]) {
        if (dfs(nr, nc)) return true
      }
    }
    vis[r][c] = false
    path.pop()
    return false
  }

  // Try multiple random starts
  const starts = shuffle(
    Array.from({ length: R * C }, (_, i) => [Math.floor(i / C), i % C] as [number, number])
  )
  for (const [sr, sc] of starts.slice(0, 4)) {
    if (dfs(sr, sc)) return path
  }

  // Fallback: snake
  path.length = 0
  for (let r = 0; r < R; r++) {
    const row: [number, number][] = Array.from({ length: C }, (_, c) => [r, c])
    if (r % 2 === 1) row.reverse()
    path.push(...row)
  }
  return path
}

function edgeKey(r1: number, c1: number, r2: number, c2: number): string {
  if (r1 === r2) return `h-${r1}-${Math.min(c1, c2)}`
  return `v-${Math.min(r1, r2)}-${c1}`
}

export function generateZip(R = 6, C = 6, numWaypoints = 7): ZipPuzzle {
  const solution = generateHamiltonianPath(R, C)

  // Collect path edges
  const pathEdges = new Set<string>()
  for (let i = 0; i < solution.length - 1; i++) {
    pathEdges.add(edgeKey(...solution[i], ...solution[i + 1]))
  }

  // Collect all interior edges
  const allEdges: string[] = []
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      if (c < C - 1) allEdges.push(`h-${r}-${c}`)
      if (r < R - 1) allEdges.push(`v-${r}-${c}`)
    }
  }

  // Non-path edges become potential blockers
  const nonPath = allEdges.filter(e => !pathEdges.has(e))

  // Add ~70% of non-path edges as walls (enough to guide but still challenging)
  const wallCount = Math.floor(nonPath.length * 0.70)
  const walls = new Set(shuffle(nonPath).slice(0, wallCount))

  // Place waypoints evenly along path
  const waypoints = Array.from({ length: R }, () => Array(C).fill(0))
  const step = Math.floor(solution.length / (numWaypoints - 1))
  for (let i = 0; i < numWaypoints; i++) {
    const idx = i === numWaypoints - 1 ? solution.length - 1 : i * step
    const [r, c] = solution[idx]
    waypoints[r][c] = i + 1
  }

  return { R, C, waypoints, walls, solution, numWaypoints }
}

export function canMove(
  r1: number, c1: number,
  r2: number, c2: number,
  walls: Set<string>
): boolean {
  if (Math.abs(r1 - r2) + Math.abs(c1 - c2) !== 1) return false
  return !walls.has(edgeKey(r1, c1, r2, c2))
}

export function hasWall(
  r: number, c: number,
  side: 'top' | 'right' | 'bottom' | 'left',
  walls: Set<string>,
  R: number, C: number
): boolean {
  if (side === 'right')  return c === C - 1 || walls.has(`h-${r}-${c}`)
  if (side === 'bottom') return r === R - 1 || walls.has(`v-${r}-${c}`)
  if (side === 'left')   return c === 0     || walls.has(`h-${r}-${c - 1}`)
  if (side === 'top')    return r === 0     || walls.has(`v-${r - 1}-${c}`)
  return false
}
