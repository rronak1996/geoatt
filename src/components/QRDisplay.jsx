import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import QRCode from 'qrcode'
import { supabase } from '../lib/supabase'
import Dashboard from './Dashboard'

const BASE_URL = 'https://rronak1996.github.io/geoatt/#'

export default function QRDisplay({ user }) {
    const { sessionId } = useParams()
    const [session, setSession] = useState(null)
    const [qrDataUrl, setQrDataUrl] = useState('')
    const [tick, setTick] = useState(0)
    const attendUrl = `${BASE_URL}/attend?session=${sessionId}`

    useEffect(() => {
        supabase.from('sessions').select('*').eq('id', sessionId).single()
            .then(({ data }) => setSession(data))
    }, [sessionId])

    useEffect(() => {
        QRCode.toDataURL(attendUrl, {
            width: 420,
            margin: 2,
            color: { dark: '#000000', light: '#ffffff' },
            errorCorrectionLevel: 'H',
        }).then(setQrDataUrl)
    }, [attendUrl])

    // Visual refresh pulse every 30s
    useEffect(() => {
        const t = setInterval(() => setTick(v => v + 1), 30000)
        return () => clearInterval(t)
    }, [])

    return (
        <Dashboard user={user}>
            <div className="page-container">
                <div className="page-header">
                    <div>
                        <h1>📺 Smartboard QR</h1>
                        {session && <p><strong>{session.subject}</strong> — Lecture {session.lecture_number} — {session.date}</p>}
                    </div>
                    <button className="btn btn-secondary" onClick={() => window.close()}>✕ Close</button>
                </div>

                <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    {/* QR Card */}
                    <div className="glass-card qr-display-card" style={{ flex: '1', minWidth: '300px' }}>
                        <div className="qr-board-wrap">
                            {qrDataUrl ? (
                                <img src={qrDataUrl} alt="Session QR Code" className="qr-board-img" />
                            ) : (
                                <div className="loading-center" style={{ padding: '60px' }}>
                                    <div className="spinner" />
                                </div>
                            )}
                        </div>

                        <div className="qr-instruction">
                            <span style={{ fontSize: '1.5rem' }}>📱</span>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>Scan to Mark Attendance</div>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                    Open your phone camera and point it at this QR code
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Session Info */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: '220px' }}>
                        <div className="glass-card" style={{ padding: '20px' }}>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Session Details</div>
                            {session && (
                                <>
                                    <div style={{ marginBottom: '8px' }}><strong>Subject:</strong> {session.subject}</div>
                                    <div style={{ marginBottom: '8px' }}><strong>Lecture:</strong> #{session.lecture_number}</div>
                                    <div style={{ marginBottom: '8px' }}><strong>Date:</strong> {session.date}</div>
                                    <div style={{ marginBottom: '8px' }}><strong>Radius:</strong> {session.radius_meters}m</div>
                                    <div>
                                        <span className={`badge ${session.is_active ? 'badge-active' : 'badge-closed'}`}>
                                            {session.is_active ? '🟢 Active' : '⚫ Closed'}
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="glass-card" style={{ padding: '20px' }}>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Student URL</div>
                            <div style={{ fontSize: '0.78rem', wordBreak: 'break-all', color: 'var(--accent-2)' }}>{attendUrl}</div>
                        </div>

                        {!session?.is_active && (
                            <div className="alert alert-error">
                                ⚠️ This session is <strong>closed</strong>. Students can no longer mark attendance.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
        .qr-display-card { padding: 32px; text-align: center; }
        .qr-board-wrap {
          background: #fff;
          border-radius: 16px;
          padding: 16px;
          display: inline-block;
          margin-bottom: 24px;
          box-shadow: 0 8px 32px rgba(108,99,255,0.3);
        }
        .qr-board-img {
          display: block;
          max-width: 100%;
          height: auto;
        }
        .qr-instruction {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 16px;
          background: rgba(108,99,255,0.1);
          border-radius: var(--radius-sm);
          border: 1px solid rgba(108,99,255,0.25);
          text-align: left;
        }
      `}</style>
        </Dashboard>
    )
}
