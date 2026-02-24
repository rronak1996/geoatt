import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Dashboard from './Dashboard'

export default function Sessions({ user }) {
    const [sessions, setSessions] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState({
        subject: '',
        lecture_number: '',
        date: new Date().toISOString().slice(0, 10),
        latitude: '',
        longitude: '',
        radius_meters: 100,
    })
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [geoLoading, setGeoLoading] = useState(false)

    const fetchSessions = async () => {
        setLoading(true)
        const { data } = await supabase
            .from('sessions')
            .select('*')
            .order('created_at', { ascending: false })
        if (data) setSessions(data)
        setLoading(false)
    }

    useEffect(() => { fetchSessions() }, [])

    const useMyLocation = () => {
        if (!navigator.geolocation) {
            setError('Geolocation not supported by your browser.')
            return
        }
        setGeoLoading(true)
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setForm(f => ({
                    ...f,
                    latitude: pos.coords.latitude.toFixed(6),
                    longitude: pos.coords.longitude.toFixed(6),
                }))
                setGeoLoading(false)
            },
            () => {
                setError('Could not get location. Please allow location access.')
                setGeoLoading(false)
            },
            { enableHighAccuracy: true }
        )
    }

    const handleCreate = async (e) => {
        e.preventDefault()
        if (!form.latitude || !form.longitude) {
            setError('Please set the classroom location (use the 📍 button or enter manually).')
            return
        }
        setSubmitting(true)
        setError('')
        const { error } = await supabase.from('sessions').insert([{
            subject: form.subject,
            lecture_number: parseInt(form.lecture_number),
            date: form.date,
            latitude: parseFloat(form.latitude),
            longitude: parseFloat(form.longitude),
            radius_meters: parseInt(form.radius_meters),
            is_active: true,
        }])
        if (error) {
            setError(error.message)
        } else {
            setForm({ subject: '', lecture_number: '', date: new Date().toISOString().slice(0, 10), latitude: '', longitude: '', radius_meters: 100 })
            setShowForm(false)
            fetchSessions()
        }
        setSubmitting(false)
    }

    const toggleSession = async (session) => {
        const msg = session.is_active ? 'Close this session?' : 'Re-open this session?'
        if (!confirm(msg)) return
        await supabase.from('sessions').update({ is_active: !session.is_active }).eq('id', session.id)
        fetchSessions()
    }

    const deleteSession = async (id) => {
        if (!confirm('Delete this session and all its attendance records?')) return
        await supabase.from('sessions').delete().eq('id', id)
        fetchSessions()
    }

    return (
        <Dashboard user={user}>
            <div className="page-container">
                <div className="page-header">
                    <div>
                        <h1>Sessions</h1>
                        <p>Create sessions and display QR codes on the smartboard</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => { setShowForm(v => !v); setError('') }}>
                        {showForm ? '✕ Cancel' : '＋ New Session'}
                    </button>
                </div>

                {/* Create Session Form */}
                {showForm && (
                    <div className="glass-card" style={{ padding: '24px', marginBottom: '24px', animation: 'fadeUp 0.3s ease' }}>
                        <h3 style={{ marginBottom: '18px', color: 'var(--accent-2)' }}>Create Session</h3>
                        {error && <div className="alert alert-error">{error}</div>}
                        <form onSubmit={handleCreate}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                                <div className="form-group">
                                    <label>Subject</label>
                                    <input type="text" placeholder="Data Structures" value={form.subject}
                                        onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} required />
                                </div>
                                <div className="form-group">
                                    <label>Lecture No.</label>
                                    <input type="number" placeholder="1" min="1" value={form.lecture_number}
                                        onChange={e => setForm(f => ({ ...f, lecture_number: e.target.value }))} required />
                                </div>
                                <div className="form-group">
                                    <label>Date</label>
                                    <input type="date" value={form.date}
                                        onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
                                </div>
                            </div>

                            {/* Geo Location Row */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '12px', alignItems: 'end' }}>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label>Latitude</label>
                                    <input type="number" step="any" placeholder="e.g. 23.0225" value={form.latitude}
                                        onChange={e => setForm(f => ({ ...f, latitude: e.target.value }))} required />
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label>Longitude</label>
                                    <input type="number" step="any" placeholder="e.g. 72.5714" value={form.longitude}
                                        onChange={e => setForm(f => ({ ...f, longitude: e.target.value }))} required />
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label>Radius (meters)</label>
                                    <input type="number" min="10" max="1000" value={form.radius_meters}
                                        onChange={e => setForm(f => ({ ...f, radius_meters: e.target.value }))} required />
                                </div>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    style={{ height: '44px', whiteSpace: 'nowrap' }}
                                    onClick={useMyLocation}
                                    disabled={geoLoading}
                                >
                                    {geoLoading ? '⏳' : '📍 Use My Location'}
                                </button>
                            </div>

                            {form.latitude && form.longitude && (
                                <div className="alert alert-info" style={{ marginTop: '12px', fontSize: '0.82rem' }}>
                                    📍 Classroom set: <strong>{form.latitude}, {form.longitude}</strong> — Radius: <strong>{form.radius_meters}m</strong>
                                </div>
                            )}

                            <button type="submit" className="btn btn-primary" disabled={submitting} style={{ marginTop: '16px' }}>
                                {submitting ? 'Creating…' : '✔ Create Session'}
                            </button>
                        </form>
                    </div>
                )}

                {/* Sessions List */}
                <div className="glass-card" style={{ overflow: 'auto' }}>
                    {loading ? (
                        <div className="loading-center"><div className="spinner" /><span>Loading…</span></div>
                    ) : sessions.length === 0 ? (
                        <div className="loading-center">
                            <span style={{ fontSize: '2rem' }}>📋</span>
                            <span style={{ color: 'var(--text-secondary)' }}>No sessions yet. Create one above!</span>
                        </div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Subject</th>
                                    <th>Lec #</th>
                                    <th>Date</th>
                                    <th>Radius</th>
                                    <th>Status</th>
                                    <th>QR Code</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sessions.map(s => (
                                    <tr key={s.id}>
                                        <td><strong>{s.subject}</strong></td>
                                        <td>
                                            <span style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.82rem', color: 'var(--accent-2)' }}>
                                                Lec {s.lecture_number}
                                            </span>
                                        </td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{s.date}</td>
                                        <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                                            {s.radius_meters ? `${s.radius_meters}m` : '—'}
                                        </td>
                                        <td>
                                            <span className={`badge ${s.is_active ? 'badge-active' : 'badge-closed'}`}>
                                                {s.is_active ? '🟢 Active' : '⚫ Closed'}
                                            </span>
                                        </td>
                                        <td>
                                            {s.latitude && s.longitude ? (
                                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                    <Link
                                                        to={`/qr/${s.id}`}
                                                        className="btn btn-primary"
                                                        style={{ padding: '6px 14px', fontSize: '0.82rem' }}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        📺 Show QR
                                                    </Link>
                                                    <Link
                                                        to={`/scanner/${s.id}`}
                                                        className="btn btn-secondary"
                                                        style={{ padding: '6px 14px', fontSize: '0.82rem' }}
                                                    >
                                                        📷 Scan
                                                    </Link>
                                                </div>
                                            ) : (
                                                <span style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>⚠ No location set</span>
                                            )}
                                        </td>
                                        <td style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                            <button
                                                className={`btn ${s.is_active ? 'btn-danger' : 'btn-success'}`}
                                                style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                                                onClick={() => toggleSession(s)}
                                            >
                                                {s.is_active ? '⛔ Close' : '✅ Open'}
                                            </button>
                                            <button
                                                className="btn btn-danger"
                                                style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                                                onClick={() => deleteSession(s.id)}
                                            >
                                                🗑
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
            <style>{`@keyframes fadeUp { from { opacity:0;transform:translateY(16px); } to { opacity:1;transform:translateY(0); } }`}</style>
        </Dashboard>
    )
}
