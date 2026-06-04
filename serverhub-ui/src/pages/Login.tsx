import { useState } from 'react';
import { Server, Eye, EyeOff, Wifi, Shield, Lock } from 'lucide-react';
import { useStore } from '../store/useStore';

export default function Login() {
  const { setAuthenticated, setAuthToken } = useStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) { setError('Please enter your credentials'); return; }
    setLoading(true);
    setError('');

    if (import.meta.env.PROD) {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });
        if (res.ok) {
          const { token } = await res.json() as { token: string };
          setAuthToken(token);
          setAuthenticated(true);
        } else {
          setError('Invalid username or password');
        }
      } catch {
        setError('Could not reach agent — is it running?');
      }
    } else {
      // Dev mode: accept demo credentials
      await new Promise((r) => setTimeout(r, 600));
      if (username === 'admin' && password === 'admin') {
        setAuthenticated(true);
      } else {
        setError('Invalid username or password');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #1d63ed, transparent)' }} />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, #1d63ed, transparent)' }} />
        {/* Grid lines */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(var(--accent-blue) 1px, transparent 1px), linear-gradient(90deg, var(--accent-blue) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }} />
      </div>

      <div className="relative z-10 w-full max-w-sm px-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl"
            style={{ background: 'linear-gradient(135deg, #1d63ed, #7c3aed)', boxShadow: '0 0 40px rgba(29, 99, 237, 0.4)' }}>
            <Server size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold gradient-text">ServerHub</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Infrastructure Management Platform</p>
        </div>

        {/* Server info */}
        <div className="flex items-center justify-center gap-2 mb-6 text-xs text-[var(--text-muted)]">
          <div className="status-dot status-online animate-pulse-dot" />
          <span>prod-server-01</span>
          <span>·</span>
          <Wifi size={11} />
          <span>192.168.1.100:8080</span>
        </div>

        {/* Login card */}
        <div className="card p-6 glow-blue">
          <h2 className="text-base font-semibold text-white mb-6 text-center">Sign In</h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] mb-2 uppercase tracking-wider">Username</label>
              <input
                className="input"
                type="text"
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] mb-2 uppercase tracking-wider">Password</label>
              <div className="relative">
                <input
                  className="input pr-10"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-[rgba(248,81,73,0.1)] border border-[rgba(248,81,73,0.3)] text-[var(--accent-red)] text-xs">
                <Shield size={12} />
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 text-sm"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Lock size={14} />
                  Sign In
                </>
              )}
            </button>
          </form>

          <div className="mt-4 text-center text-[10px] text-[var(--text-muted)]">
            Demo: <span className="text-[var(--text-secondary)]">admin / admin</span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-[10px] text-[var(--text-muted)]">
          <div className="flex items-center justify-center gap-3">
            <Shield size={10} />
            <span>TLS encrypted connection</span>
            <span>·</span>
            <span>ServerHub v1.0.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
