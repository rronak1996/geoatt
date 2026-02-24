import { useState, useEffect } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import Students from './components/Students'
import Sessions from './components/Sessions'
import QRDisplay from './components/QRDisplay'
import Reports from './components/Reports'
import Attend from './components/Attend'
import Scanner from './components/Scanner'

function ProtectedRoute({ user, children }) {
    if (!user) return <Navigate to="/" replace />
    return children
}

export default function App() {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null)
            setLoading(false)
        })
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
        })
        return () => subscription.unsubscribe()
    }, [])

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
                <div className="loading-center"><div className="spinner"></div><span>Initializing…</span></div>
            </div>
        )
    }

    return (
        <HashRouter>
            <Routes>
                {/* Public Routes */}
                <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
                <Route path="/attend" element={<Attend />} />

                {/* Protected Routes — teacher only */}
                <Route path="/dashboard" element={<ProtectedRoute user={user}><Dashboard user={user} /></ProtectedRoute>} />
                <Route path="/students" element={<ProtectedRoute user={user}><Students user={user} /></ProtectedRoute>} />
                <Route path="/sessions" element={<ProtectedRoute user={user}><Sessions user={user} /></ProtectedRoute>} />
                <Route path="/qr/:sessionId" element={<ProtectedRoute user={user}><QRDisplay user={user} /></ProtectedRoute>} />
                <Route path="/scanner/:sessionId" element={<ProtectedRoute user={user}><Scanner user={user} /></ProtectedRoute>} />
                <Route path="/reports" element={<ProtectedRoute user={user}><Reports user={user} /></ProtectedRoute>} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </HashRouter>
    )
}
