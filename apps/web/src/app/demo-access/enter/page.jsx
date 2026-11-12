import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Sparkles, Loader2 } from 'lucide-react';
import { enterDemo } from '@/api/demo-access';
import { useAuth } from '@/hooks/useAuth';

export default function DemoEnterPage() {
  const [params] = useSearchParams();
  const { login } = useAuth();
  const [state, setState] = useState('working');
  const [error, setError] = useState('');
  const [hotel, setHotel] = useState('');

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      setState('error');
      setError('This link is missing its token.');
      return;
    }
    (async () => {
      try {
        const creds = await enterDemo(token);
        setHotel(creds.hotelName);
        const result = await login({
          tenantSlug: creds.tenantSlug,
          email: creds.email,
          password: creds.password,
        });
        if (!result?.success) throw new Error(result?.error || 'Login failed');
        window.location.href = '/app/dashboard';
      } catch (e) {
        setState('error');
        setError(e.message);
      }
    })();
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg,#1e1b4b,#0f172a)',
        color: '#fff',
        fontFamily: 'system-ui',
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: 420, padding: 24 }}>
        <Sparkles size={36} style={{ color: '#a78bfa' }} />
        {state === 'working' ? (
          <>
            <h1 style={{ fontSize: 22, margin: '14px 0 6px' }}>
              Opening your demo{hotel ? ` — ${hotel}` : ''}…
            </h1>
            <p style={{ opacity: 0.75, fontSize: 14 }}>
              Checking your magic link and signing you in.
            </p>
            <Loader2 size={22} style={{ marginTop: 14, animation: 'spin 1s linear infinite' }} />
          </>
        ) : (
          <>
            <h1 style={{ fontSize: 20, margin: '14px 0 6px' }}>This demo link didn't work</h1>
            <p style={{ opacity: 0.8, fontSize: 14 }}>{error}</p>
            <button
              onClick={() => {
                window.location.href = '/';
              }}
              style={{
                marginTop: 18,
                padding: '10px 22px',
                borderRadius: 10,
                border: 'none',
                background: '#8b5cf6',
                color: '#fff',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Back to site
            </button>
          </>
        )}
      </div>
    </div>
  );
}
