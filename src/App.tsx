import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ToastProvider, SharedAuthProvider, Header, Footer } from '@cloistr/ui/components'
import '@cloistr/ui/styles'
import { Welcome, Register, Lookup, Purchase, Success, Dashboard, NotFound } from './pages'
import './index.css'

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-layout">
      <Header activeServiceId="me" />
      <main className="main-content">
        {children}
      </main>
      <Footer />
    </div>
  )
}

function App() {
  return (
    <ToastProvider>
      <SharedAuthProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Welcome />} />
              <Route path="/register" element={<Register />} />
              <Route path="/lookup" element={<Lookup />} />
              <Route path="/purchase/:username" element={<Purchase />} />
              <Route path="/success/:username" element={<Success />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </SharedAuthProvider>
    </ToastProvider>
  )
}

export default App
