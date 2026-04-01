import { useState } from 'react'
import HomeScreen from './components/HomeScreen'
import ZipGame from './games/zip/ZipGame'
import SudokuGame from './games/sudoku/SudokuGame'
import QueensGame from './games/queens/QueensGame'

type Screen = 'home' | 'zip' | 'sudoku' | 'queens'

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')

  if (screen === 'zip')    return <ZipGame    onBack={() => setScreen('home')} />
  if (screen === 'sudoku') return <SudokuGame  onBack={() => setScreen('home')} />
  if (screen === 'queens') return <QueensGame  onBack={() => setScreen('home')} />

  return <HomeScreen onNavigate={s => setScreen(s)} />
}
