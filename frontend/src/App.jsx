import { useLocation, BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import './styles/globals.css'

import Navbar from './components/shared/Navbar'
import Landing from './pages/Landing'
import Generator from './pages/Generator'
import Dashboard from './pages/Dashboard'
import Interrogation from './pages/Interrogation'
import TheoryBoard from './pages/TheoryBoard'
import CaseHistory from './pages/CaseHistory'
import NotFound from './pages/NotFound'

// Pages that have their own full-screen top bars — skip global Navbar
const GAME_ROUTES = ['/dashboard', '/interrogate', '/generate']

function AppShell() {
  const location = useLocation()
  const isGameRoute = GAME_ROUTES.some((r) => location.pathname.startsWith(r))

  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: { background: '#12121A', color: '#F8FAFC', border: '1px solid #1E1E2E', fontFamily: 'Inter, sans-serif', fontSize: 13 },
        }}
      />

      {!isGameRoute && <Navbar />}

      <Routes>
        <Route path="/"                                    element={<Landing />} />
        <Route path="/generate"                            element={<Generator />} />
        <Route path="/dashboard/:mysteryId"                element={<Dashboard />} />
        <Route path="/interrogate/:mysteryId/:suspectId"   element={<Interrogation />} />
        <Route path="/theory/:mysteryId"                   element={<TheoryBoard />} />
        <Route path="/history"                             element={<CaseHistory />} />
<Route path="*"                                    element={<NotFound />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  )
}
