import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

// Haversine formula — distance in meters between two lat/lng points
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000 // Earth radius in meters
    const toRad = x => (x * Math.PI) / 180
    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lon2 - lon1)
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export default function Attend() {
    const [params] = useSearchParams()
    const sessionId = params.get('session')

    const [session, setSession] = useState(null)
    const [rollNumber, setRollNumber] = useState('')
    const [status, setStatus] = useState('idle') // idle | locating | checking | success | error | closed
    const [message, setMessage] = useState('')
    const [distance, setDistance] = useState(null)
    const [loadingSession, setLoadingSession] = useState(true)

    useEffect(() => {
        if (!sessionId) {
            setLoadingSession(false)
            return
        }
        supabase.from('sessions').select('*').eq('id', sessionId).single()
            .then(({ data, error }) => {
                if (error || !data) {
                    setStatus('error')
                    setMessage('Session not found. Please scan the QR code again.')
                } else {
                    setSession(data)
                    if (!data.is_active) setStatus('closed')
                }
                setLoadingSession(false)
            })
    }, [sessionId])

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!rollNumber.trim()) return

        setStatus('locating')
        setMessage('')
        setDistance(null)

        // 1. Get student's location
        if (!navigator.geolocation) {
            setStatus('error')
            setMessage('Your browser does not support GPS location. Please try on another browser.')
            return
        }

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const studentLat = pos.coords.latitude
                const studentLng = pos.coords.longitude

                setStatus('checking')

                // 2. Compute distance from classroom
                const dist = getDistance(session.latitude, session.longitude, studentLat, studentLng)
                setDistance(Math.round(dist))

                if (dist > session.radius_meters) {
                    setStatus('error')
                    setMessage(`You are ${Math.round(dist)}m away from the classroom (max allowed: ${session.radius_meters}m). You must be physically present to mark attendance.`)
                    return
                }

                // 3. Look up student by roll number
                const { data: students, error: stuErr } = await supabase
                    .from('students')
                    .select('*')
                    .ilike('roll_number', rollNumber.trim())

                if (stuErr || !students || students.length === 0) {
                    setStatus('error')
                    setMessage(`Roll number "${rollNumber}" not found. Please check and try again.`)
                    return
                }

                const student = students[0]

                // 4. Check already marked
                const { data: existing } = await supabase
                    .from('attendance')
                    .select('id')
                    .eq('session_id', sessionId)
                    .eq('student_id', student.id)
                    .maybeSingle()

                if (existing) {
                    setStatus('success')
                    setMessage(`✅ ${student.name}, your attendance was already marked for this session!`)
                    return
                }

                // 5. Insert attendance
                const { error: insErr } = await supabase.from('attendance').insert([{
                    session_id: sessionId,
                    student_id: student.id,
                    student_lat: studentLat,
                    student_lng: studentLng,
                }])

                if (insErr) {
                    setStatus('error')
                    setMessage('Could not save attendance: ' + insErr.message)
                } else {
                    setStatus('success')
                    setMessage(`🎉 ${student.name}, your attendance has been marked!`)
                }
            },
            (err) => {
                setStatus('error')
                if (err.code === 1) {
                    setMessage('Location access denied. Please allow location permission and try again.')
                } else {
                    setMessage('Could not get your location. Please try again.')
                }
            },
            { enableHighAccuracy: true, timeout: 15000 }
        )
    }

    if (loadingSession) {
        return (
            <div className="attend-bg">
                <div className="loading-center"><div className="spinner" /></div>
            </div>
        )
    }

    if (!sessionId) {
        return (
            <div className="attend-bg">
                <div className="attend-card glass-card">
                    <div className="attend-icon">⚠️</div>
                    <h2>Invalid Link</h2>
                    <p>Please scan the QR code from the smartboard again.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="attend-bg">
            <div className="attend-card glass-card">
                {/* Header */}
                <div className="attend-header">
                    <div className="attend-logo">📡</div>
                    <h1 className="attend-title">Mark Attendance</h1>
                </div>

                {/* Session Info */}
                {session && (
                    <div className="session-info-box">
                        <div className="session-info-row">
                            <span className="sinfo-label">Subject</span>
                            <span className="sinfo-val">{session.subject}</span>
                        </div>
                        <div className="session-info-row">
                            <span className="sinfo-label">Lecture</span>
                            <span className="sinfo-val">#{session.lecture_number}</span>
                        </div>
                        <div className="session-info-row">
                            <span className="sinfo-label">Date</span>
                            <span className="sinfo-val">{session.date}</span>
                        </div>
                    </div>
                )}

                {/* Closed Session */}
                {status === 'closed' && (
                    <div className="alert alert-error" style={{ textAlign: 'center', padding: '20px' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🔒</div>
                        <strong>Session Closed</strong>
                        <div style={{ marginTop: '6px', fontSize: '0.85rem' }}>This session is no longer accepting attendance.</div>
                    </div>
                )}

                {/* Form */}
                {status !== 'closed' && status !== 'success' && (
                    <form onSubmit={handleSubmit} className="attend-form">
                        <div className="form-group">
                            <label>Your Roll Number</label>
                            <input
                                id="rollNumber"
                                type="text"
                                placeholder="e.g. CS2024001"
                                value={rollNumber}
                                onChange={e => setRollNumber(e.target.value)}
                                required
                                autoFocus
                                style={{ fontSize: '1.1rem', padding: '14px' }}
                                disabled={status === 'locating' || status === 'checking'}
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary attend-submit-btn"
                            disabled={status === 'locating' || status === 'checking'}
                        >
                            {status === 'locating' && <><span className="btn-spinner"></span> Getting your location…</>}
                            {status === 'checking' && <><span className="btn-spinner"></span> Verifying…</>}
                            {(status === 'idle' || status === 'error') && '📍 Mark My Attendance'}
                        </button>

                        <p className="attend-geo-note">
                            🔒 Your GPS location will be verified to confirm you are physically in the classroom.
                        </p>
                    </form>
                )}

                {/* Status Messages */}
                {status === 'success' && (
                    <div className="attend-result attend-success">
                        <div className="result-icon">✅</div>
                        <div className="result-msg">{message}</div>
                        {distance !== null && (
                            <div className="result-sub">You were {distance}m from the classroom</div>
                        )}
                    </div>
                )}

                {status === 'error' && (
                    <div className="alert alert-error" style={{ marginTop: '12px' }}>
                        {message}
                    </div>
                )}
            </div>

            <style>{`
        .attend-bg {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          position: relative;
          z-index: 1;
        }
        .attend-card {
          width: 100%;
          max-width: 440px;
          padding: 36px 32px;
          animation: fadeUp 0.5s ease;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .attend-header {
          text-align: center;
          margin-bottom: 24px;
        }
        .attend-logo {
          font-size: 2.4rem;
          width: 64px;
          height: 64px;
          background: var(--accent-gradient);
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 14px;
          box-shadow: 0 8px 24px rgba(108,99,255,0.5);
        }
        .attend-title {
          font-size: 1.6rem;
          font-weight: 800;
          background: var(--accent-gradient);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .session-info-box {
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-sm);
          padding: 14px 16px;
          margin-bottom: 20px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .session-info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.9rem;
        }
        .sinfo-label { color: var(--text-secondary); font-size: 0.82rem; }
        .sinfo-val { font-weight: 600; color: var(--accent-2); }
        .attend-form { display: flex; flex-direction: column; gap: 4px; }
        .attend-submit-btn {
          width: 100%;
          justify-content: center;
          padding: 14px;
          font-size: 1rem;
          margin-top: 4px;
          border-radius: var(--radius-sm);
        }
        .attend-geo-note {
          font-size: 0.75rem;
          color: var(--text-muted);
          text-align: center;
          margin-top: 8px;
        }
        .attend-result {
          text-align: center;
          padding: 28px 16px;
          border-radius: var(--radius-sm);
          margin-top: 8px;
        }
        .attend-success {
          background: rgba(0,229,160,0.1);
          border: 1px solid rgba(0,229,160,0.3);
        }
        .result-icon { font-size: 3rem; margin-bottom: 10px; }
        .result-msg { font-size: 1.1rem; font-weight: 700; color: var(--success); }
        .result-sub { font-size: 0.82rem; color: var(--text-secondary); margin-top: 6px; }
        .btn-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          display: inline-block;
        }
      `}</style>
        </div>
    )
}
