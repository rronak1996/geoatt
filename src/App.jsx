import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import Students from './components/Students'
import Sessions from './components/Sessions'
import Scanner from './components/Scanner'
import Reports from './components/Reports'

function ProtectedRoute({ user, children }) {
    if (!user) return <Navigate to="/geoatt/" replace />
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
                <div className="loading-center">
                    <div className="spinner"></div>
                    <span>Initializing…</span>
                </div>
            </div>
        )
    }

    return (
        <BrowserRouter>
            <Routes>
                <Route
                    path="/geoatt/"
                    element={user ? <Navigate to="/geoatt/dashboard" replace /> : <Login />}
                />
                <Route
                    path="/geoatt/dashboard"
                    element={<ProtectedRoute user={user}><Dashboard user={user} /></ProtectedRoute>}
                />
                <Route
                    path="/geoatt/students"
                    element={<ProtectedRoute user={user}><Students user={user} /></ProtectedRoute>}
                />
                <Route
                    path="/geoatt/sessions"
                    element={<ProtectedRoute user={user}><Sessions user={user} /></ProtectedRoute>}
                />
                <Route
                    path="/geoatt/scanner/:sessionId"
                    element={<ProtectedRoute user={user}><Scanner user={user} /></ProtectedRoute>}
                />
                <Route
                    path="/geoatt/reports"
                    element={<ProtectedRoute user={user}><Reports user={user} /></ProtectedRoute>}
                />
                <Route path="*" element={<Navigate to="/geoatt/" replace />} />
            </Routes>
        </BrowserRouter>
    )
}
