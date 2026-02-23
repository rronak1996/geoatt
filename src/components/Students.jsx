import { useState, useEffect } from 'react'
import QRCode from 'qrcode'
import { supabase } from '../lib/supabase'
import Dashboard from './Dashboard'

export default function Students({ user }) {
    const [students, setStudents] = useState([])
    const [loading, setLoading] = useState(true)
    const [form, setForm] = useState({ name: '', roll_number: '', division: '', email: '' })
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [showForm, setShowForm] = useState(false)
    const [qrLoading, setQrLoading] = useState(null)

    const fetchStudents = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('students')
            .select('*')
            .order('created_at', { ascending: false })
        if (!error) setStudents(data)
        setLoading(false)
    }

    useEffect(() => { fetchStudents() }, [])

    const handleAdd = async (e) => {
        e.preventDefault()
        setSubmitting(true)
        setError('')
        setSuccess('')
        const { error } = await supabase.from('students').insert([form])
        if (error) {
            setError(error.message)
        } else {
            setSuccess('Student added successfully!')
            setForm({ name: '', roll_number: '', division: '', email: '' })
            setShowForm(false)
            fetchStudents()
        }
        setSubmitting(false)
    }

    const downloadQR = async (student) => {
        setQrLoading(student.id)
        try {
            const url = await QRCode.toDataURL(student.id, {
                width: 300,
                margin: 2,
                color: { dark: '#000000', light: '#ffffff' },
                errorCorrectionLevel: 'H',
            })
            const link = document.createElement('a')
            link.href = url
            link.download = `QR_${student.roll_number}_${student.name.replace(/\s+/g, '_')}.png`
            link.click()
        } catch (err) {
            console.error(err)
        }
        setQrLoading(null)
    }

    const deleteStudent = async (id) => {
        if (!confirm('Delete this student? This will also remove their attendance records.')) return
        await supabase.from('students').delete().eq('id', id)
        fetchStudents()
    }

    return (
        <Dashboard user={user}>
            <div className="page-container">
                <div className="page-header">
                    <div>
                        <h1>Students</h1>
                        <p>Manage enrolled students and their QR codes</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => setShowForm(v => !v)}>
                        {showForm ? '✕ Cancel' : '＋ Add Student'}
                    </button>
                </div>

                {/* Add Student Form */}
                {showForm && (
                    <div className="glass-card" style={{ padding: '24px', marginBottom: '24px', animation: 'fadeUp 0.3s ease' }}>
                        <h3 style={{ marginBottom: '18px', color: 'var(--accent-2)' }}>New Student</h3>
                        {error && <div className="alert alert-error">{error}</div>}
                        {success && <div className="alert alert-success">{success}</div>}
                        <form onSubmit={handleAdd}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div className="form-group">
                                    <label>Full Name</label>
                                    <input
                                        type="text"
                                        placeholder="Rronak Patel"
                                        value={form.name}
                                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Roll Number</label>
                                    <input
                                        type="text"
                                        placeholder="CS2024001"
                                        value={form.roll_number}
                                        onChange={e => setForm(f => ({ ...f, roll_number: e.target.value }))}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Division</label>
                                    <input
                                        type="text"
                                        placeholder="A"
                                        value={form.division}
                                        onChange={e => setForm(f => ({ ...f, division: e.target.value }))}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Email (optional)</label>
                                    <input
                                        type="email"
                                        placeholder="student@college.edu"
                                        value={form.email}
                                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <button type="submit" className="btn btn-primary" disabled={submitting} style={{ marginTop: '8px' }}>
                                {submitting ? 'Adding…' : '✔ Add Student'}
                            </button>
                        </form>
                    </div>
                )}

                {/* Students Table */}
                <div className="glass-card" style={{ overflow: 'auto' }}>
                    {loading ? (
                        <div className="loading-center">
                            <div className="spinner" />
                            <span>Loading students…</span>
                        </div>
                    ) : students.length === 0 ? (
                        <div className="loading-center">
                            <span style={{ fontSize: '2rem' }}>👥</span>
                            <span style={{ color: 'var(--text-secondary)' }}>No students yet. Add one above!</span>
                        </div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Roll No.</th>
                                    <th>Division</th>
                                    <th>Email</th>
                                    <th>QR Code</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map(s => (
                                    <tr key={s.id}>
                                        <td><strong>{s.name}</strong></td>
                                        <td><code style={{ background: 'rgba(108,99,255,0.12)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.85rem' }}>{s.roll_number}</code></td>
                                        <td>{s.division}</td>
                                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{s.email || '—'}</td>
                                        <td>
                                            <button
                                                className="btn btn-secondary"
                                                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                                onClick={() => downloadQR(s)}
                                                disabled={qrLoading === s.id}
                                            >
                                                {qrLoading === s.id ? '⏳' : '⬇ QR'}
                                            </button>
                                        </td>
                                        <td>
                                            <button
                                                className="btn btn-danger"
                                                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                                onClick={() => deleteStudent(s.id)}
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
            <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
        </Dashboard>
    )
}
