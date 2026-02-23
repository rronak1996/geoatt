import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Dashboard from './Dashboard'

export default function Reports({ user }) {
    const [sessions, setSessions] = useState([])
    const [selectedSession, setSelectedSession] = useState('')
    const [allStudents, setAllStudents] = useState([])
    const [presentIds, setPresentIds] = useState(new Set())
    const [loadingReport, setLoadingReport] = useState(false)

    useEffect(() => {
        supabase.from('sessions').select('*').order('created_at', { ascending: false })
            .then(({ data }) => { if (data) setSessions(data) })
        supabase.from('students').select('*').order('name')
            .then(({ data }) => { if (data) setAllStudents(data) })
    }, [])

    useEffect(() => {
        if (!selectedSession) return
        setLoadingReport(true)
        supabase
            .from('attendance')
            .select('student_id')
            .eq('session_id', selectedSession)
            .then(({ data }) => {
                if (data) setPresentIds(new Set(data.map(r => r.student_id)))
                setLoadingReport(false)
            })
    }, [selectedSession])

    const session = sessions.find(s => s.id === selectedSession)
    const presentStudents = allStudents.filter(s => presentIds.has(s.id))
    const absentStudents = allStudents.filter(s => !presentIds.has(s.id))
    const pct = allStudents.length > 0
        ? Math.round((presentStudents.length / allStudents.length) * 100)
        : 0

    return (
        <Dashboard user={user}>
            <div className="page-container">
                <div className="page-header">
                    <div>
                        <h1>Reports</h1>
                        <p>View attendance per session</p>
                    </div>
                </div>

                {/* Session Selector */}
                <div className="glass-card" style={{ padding: '20px', marginBottom: '24px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Select Session</label>
                        <select value={selectedSession} onChange={e => setSelectedSession(e.target.value)}>
                            <option value="">— Choose a session —</option>
                            {sessions.map(s => (
                                <option key={s.id} value={s.id}>
                                    {s.subject} — Lec {s.lecture_number} — {s.date} {s.is_active ? '(Active)' : '(Closed)'}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {!selectedSession && (
                    <div className="loading-center">
                        <span style={{ fontSize: '2.5rem' }}>📊</span>
                        <span style={{ color: 'var(--text-secondary)' }}>Select a session above to view its attendance</span>
                    </div>
                )}

                {selectedSession && loadingReport && (
                    <div className="loading-center"><div className="spinner" /><span>Loading report…</span></div>
                )}

                {selectedSession && !loadingReport && (
                    <>
                        {/* Stats Row */}
                        <div className="stats-row">
                            <div className="glass-card stat-card">
                                <div className="stat-num" style={{ color: 'var(--accent-2)' }}>{allStudents.length}</div>
                                <div className="stat-label">Total Students</div>
                            </div>
                            <div className="glass-card stat-card">
                                <div className="stat-num" style={{ color: 'var(--success)' }}>{presentStudents.length}</div>
                                <div className="stat-label">Present</div>
                            </div>
                            <div className="glass-card stat-card">
                                <div className="stat-num" style={{ color: 'var(--danger)' }}>{absentStudents.length}</div>
                                <div className="stat-label">Absent</div>
                            </div>
                            <div className="glass-card stat-card">
                                <div className="stat-num" style={{ color: pct >= 75 ? 'var(--success)' : 'var(--warning)' }}>{pct}%</div>
                                <div className="stat-label">Attendance Rate</div>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="glass-card" style={{ padding: '20px', marginBottom: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                <span>{session?.subject} — Lecture {session?.lecture_number} — {session?.date}</span>
                                <span>{pct}% present</span>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '6px', height: '10px', overflow: 'hidden' }}>
                                <div style={{
                                    width: `${pct}%`,
                                    height: '100%',
                                    background: 'var(--accent-gradient)',
                                    borderRadius: '6px',
                                    transition: 'width 0.8s ease',
                                }} />
                            </div>
                        </div>

                        {/* Present / Absent Tables */}
                        <div className="report-grid">
                            <div className="glass-card" style={{ overflow: 'auto' }}>
                                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3 style={{ fontSize: '1rem' }}>✅ Present</h3>
                                    <span className="badge badge-success">{presentStudents.length}</span>
                                </div>
                                {presentStudents.length === 0 ? (
                                    <div className="loading-center" style={{ padding: '30px' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>None present yet</span>
                                    </div>
                                ) : (
                                    <table className="data-table">
                                        <thead><tr><th>Name</th><th>Roll</th><th>Div</th></tr></thead>
                                        <tbody>
                                            {presentStudents.map(s => (
                                                <tr key={s.id}>
                                                    <td><strong>{s.name}</strong></td>
                                                    <td><code style={{ fontSize: '0.8rem' }}>{s.roll_number}</code></td>
                                                    <td>{s.division}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>

                            <div className="glass-card" style={{ overflow: 'auto' }}>
                                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3 style={{ fontSize: '1rem' }}>❌ Absent</h3>
                                    <span className="badge badge-danger">{absentStudents.length}</span>
                                </div>
                                {absentStudents.length === 0 ? (
                                    <div className="loading-center" style={{ padding: '30px' }}>
                                        <span style={{ color: 'var(--success)', fontSize: '0.9rem' }}>All students present! 🎉</span>
                                    </div>
                                ) : (
                                    <table className="data-table">
                                        <thead><tr><th>Name</th><th>Roll</th><th>Div</th></tr></thead>
                                        <tbody>
                                            {absentStudents.map(s => (
                                                <tr key={s.id}>
                                                    <td style={{ color: 'var(--text-secondary)' }}>{s.name}</td>
                                                    <td><code style={{ fontSize: '0.8rem', color: 'var(--danger)' }}>{s.roll_number}</code></td>
                                                    <td style={{ color: 'var(--text-secondary)' }}>{s.division}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>

            <style>{`
        .stats-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 20px;
        }
        .stat-card {
          padding: 24px 16px;
          text-align: center;
        }
        .stat-num { font-size: 2rem; font-weight: 800; line-height: 1; }
        .stat-label { font-size: 0.75rem; color: var(--text-secondary); margin-top: 6px; text-transform: uppercase; letter-spacing: 0.05em; }
        .report-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        @media (max-width: 900px) {
          .stats-row { grid-template-columns: repeat(2, 1fr); }
          .report-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 480px) {
          .stats-row { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
        </Dashboard>
    )
}
