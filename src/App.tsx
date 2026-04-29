import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ToastProvider } from '@cloistr/ui/components'
import '@cloistr/ui/styles'
import { AuthProvider } from './lib/nostr'
import { Welcome, Register, Lookup, Purchase, Success, Dashboard, NotFound } from './pages'
import './index.css'

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/register" element={<Register />} />
            <Route path="/lookup" element={<Lookup />} />
            <Route path="/purchase/:username" element={<Purchase />} />
            <Route path="/success/:username" element={<Success />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  )
}

export default App
