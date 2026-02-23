import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleLogin = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) setError(error.message)
        setLoading(false)
    }

    return (
        <div className="login-bg">
            <div className="login-wrap">
                <div className="glass-card login-card">
                    {/* Logo / Icon */}
                    <div className="login-icon-wrap">
                        <span className="login-icon">📡</span>
                    </div>

                    <h1 className="login-title">QR Attendance</h1>
                    <p className="login-sub">Admin Portal — Teacher Access Only</p>

                    {error && <div className="alert alert-error">{error}</div>}

                    <form onSubmit={handleLogin} className="login-form">
                        <div className="form-group">
                            <label htmlFor="email">Email Address</label>
                            <input
                                id="email"
                                type="email"
                                placeholder="teacher@college.edu"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
                            {loading ? (
                                <>
                                    <span className="btn-spinner"></span>
                                    Signing In…
                                </>
                            ) : (
                                '🔐 Sign In'
                            )}
                        </button>
                    </form>

                    <p className="login-footer">
                        Students do not need accounts. QR codes are scanned by teachers.
                    </p>
                </div>
            </div>

            <style>{`
        .login-bg {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          position: relative;
          z-index: 1;
        }
        .login-wrap {
          width: 100%;
          max-width: 420px;
          animation: fadeUp 0.5s ease;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .login-card {
          padding: 40px 36px;
          text-align: center;
        }
        .login-icon-wrap {
          width: 64px;
          height: 64px;
          background: var(--accent-gradient);
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          box-shadow: 0 8px 24px rgba(108,99,255,0.5);
        }
        .login-icon { font-size: 1.8rem; }
        .login-title {
          font-size: 1.8rem;
          font-weight: 800;
          background: var(--accent-gradient);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 6px;
        }
        .login-sub {
          color: var(--text-secondary);
          font-size: 0.85rem;
          margin-bottom: 28px;
        }
        .login-form { text-align: left; }
        .login-btn {
          width: 100%;
          justify-content: center;
          padding: 13px;
          font-size: 1rem;
          margin-top: 4px;
          border-radius: var(--radius-sm);
        }
        .btn-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          display: inline-block;
        }
        .login-footer {
          margin-top: 24px;
          font-size: 0.78rem;
          color: var(--text-muted);
        }
      `}</style>
        </div>
    )
}
