import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'
import { supabase } from '../lib/supabase'
import Dashboard from './Dashboard'

export default function Scanner({ user }) {
    const { sessionId } = useParams()
    const navigate = useNavigate()
    const [session, setSession] = useState(null)
    const [scanned, setScanned] = useState([]) // { student, markedAt, status }
    const [scannerStatus, setScannerStatus] = useState('idle') // idle | running | stopped
    const [lastScan, setLastScan] = useState(null)
    const [error, setError] = useState('')
    const qrRef = useRef(null)
    const scannerRef = useRef(null)
    const processingRef = useRef(false)

    useEffect(() => {
        // Load session info
        ; (async () => {
            const { data } = await supabase.from('sessions').select('*').eq('id', sessionId).single()
            setSession(data)
            if (data && !data.is_active) setError('This session is closed. No more attendance can be marked.')
        })()

            // Load already-scanned students for this session
            ; (async () => {
                const { data } = await supabase
                    .from('attendance')
                    .select('*, students(*)')
                    .eq('session_id', sessionId)
                    .order('marked_at', { ascending: false })
                if (data) {
                    setScanned(data.map(r => ({ student: r.students, markedAt: r.marked_at, status: 'present' })))
                }
            })()

        return () => stopScanner()
    }, [sessionId])

    const startScanner = async () => {
        if (scannerRef.current) return
        setScannerStatus('running')
        const html5Qr = new Html5Qrcode('qr-reader')
        scannerRef.current = html5Qr

        try {
            await html5Qr.start(
                { facingMode: 'environment' },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                handleQrScan,
                () => { } // silent errors
            )
        } catch (err) {
            setError('Camera access denied or unavailable: ' + err.message)
            scannerRef.current = null
            setScannerStatus('idle')
        }
    }

    const stopScanner = async () => {
        if (scannerRef.current && scannerRef.current.isScanning) {
            await scannerRef.current.stop()
            scannerRef.current.clear()
        }
        scannerRef.current = null
        setScannerStatus('stopped')
    }

    const handleQrScan = async (decodedText) => {
        if (processingRef.current) return
        processingRef.current = true

        try {
            // Look up student by id (the QR encodes the student UUID)
            const { data: student, error: stuErr } = await supabase
                .from('students')
                .select('*')
                .eq('id', decodedText.trim())
                .single()

            if (stuErr || !student) {
                setLastScan({ type: 'error', message: 'Unknown QR — student not found.' })
                setTimeout(() => processingRef.current = false, 2000)
                return
            }

            // Check for duplicate
            const alreadyScanned = scanned.some(s => s.student?.id === student.id)
            if (alreadyScanned) {
                setLastScan({ type: 'duplicate', message: `${student.name} already marked present!` })
                setTimeout(() => processingRef.current = false, 2000)
                return
            }

            // Insert attendance
            const { error: insErr } = await supabase.from('attendance').insert([{
                session_id: sessionId,
                student_id: student.id,
            }])

            if (insErr) {
                // Handle unique constraint violation (duplicate)
                setLastScan({ type: 'duplicate', message: `${student.name} already marked (DB conflict).` })
            } else {
                const entry = { student, markedAt: new Date().toISOString(), status: 'present' }
                setScanned(prev => [entry, ...prev])
                setLastScan({ type: 'success', message: `✅ ${student.name} marked Present!` })
            }
        } catch (err) {
            setLastScan({ type: 'error', message: 'Scan error: ' + err.message })
        }

        setTimeout(() => { processingRef.current = false }, 2500)
    }

    return (
        <Dashboard user={user}>
            <div className="page-container">
                <div className="page-header">
                    <div>
                        <h1>📷 QR Scanner</h1>
                        {session && (
                            <p>
                                <strong>{session.subject}</strong> — Lecture {session.lecture_number} &nbsp;|&nbsp; {session.date}
                                &nbsp;
                                <span className={`badge ${session.is_active ? 'badge-active' : 'badge-closed'}`}>
                                    {session.is_active ? 'Active' : 'Closed'}
                                </span>
                            </p>
                        )}
                    </div>
                    <button className="btn btn-secondary" onClick={() => navigate('/sessions')}>
                        ← Back
                    </button>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                <div className="scanner-layout">
                    {/* Camera Panel */}
                    <div className="glass-card scanner-panel">
                        <div id="qr-reader" style={{ width: '100%', borderRadius: '10px', overflow: 'hidden' }} ref={qrRef} />

                        {scannerStatus === 'idle' && (
                            <div className="scanner-placeholder">
                                <span style={{ fontSize: '3rem' }}>📷</span>
                                <p>Camera not started</p>
                            </div>
                        )}

                        {/* Last scan feedback */}
                        {lastScan && (
                            <div className={`alert ${lastScan.type === 'success' ? 'alert-success' :
                                lastScan.type === 'duplicate' ? 'alert-info' : 'alert-error'
                                }`} style={{ marginTop: '12px', textAlign: 'center', fontSize: '1rem', fontWeight: 600 }}>
                                {lastScan.message}
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '10px', marginTop: '16px', justifyContent: 'center' }}>
                            {scannerStatus !== 'running' ? (
                                <button
                                    className="btn btn-primary"
                                    onClick={startScanner}
                                    disabled={!session?.is_active}
                                >
                                    🎥 Start Camera
                                </button>
                            ) : (
                                <button className="btn btn-danger" onClick={stopScanner}>
                                    ⏹ Stop Camera
                                </button>
                            )}
                        </div>

                        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '10px' }}>
                            {session?.is_active
                                ? 'Point the camera at a student QR code to mark attendance'
                                : 'Session is closed — read-only view'}
                        </p>
                    </div>

                    {/* Attendance Log */}
                    <div className="glass-card scanner-log">
                        <div style={{ padding: '20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Present Students</h3>
                            <span className="badge badge-success">{scanned.length} scanned</span>
                        </div>
                        <div style={{ overflow: 'auto', maxHeight: '420px' }}>
                            {scanned.length === 0 ? (
                                <div className="loading-center" style={{ padding: '40px' }}>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No scans yet…</span>
                                </div>
                            ) : (
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Name</th>
                                            <th>Roll</th>
                                            <th>Time</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {scanned.map((entry, i) => (
                                            <tr key={entry.student?.id + i}>
                                                <td style={{ color: 'var(--text-muted)' }}>{scanned.length - i}</td>
                                                <td><strong>{entry.student?.name}</strong></td>
                                                <td><code style={{ fontSize: '0.8rem' }}>{entry.student?.roll_number}</code></td>
                                                <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                                    {new Date(entry.markedAt).toLocaleTimeString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
        .scanner-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          align-items: start;
        }
        .scanner-panel {
          padding: 20px;
        }
        .scanner-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          padding: 40px;
          color: var(--text-muted);
        }
        .scanner-log { overflow: hidden; }
        @media (max-width: 900px) {
          .scanner-layout { grid-template-columns: 1fr; }
        }
      `}</style>
        </Dashboard>
    )
}
