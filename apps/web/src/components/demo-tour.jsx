import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { X, ChevronDown, ChevronUp, MapPin } from 'lucide-react';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function DemoTourBanner() {
  const { user } = useAuth();
  const tenantId = user?.tenantId;
  const [tour, setTour] = useState(null);
  const [open, setOpen] = useState(true);
  const [state, setState] = useState(() =>
    tenantId
      ? JSON.parse(localStorage.getItem(`demo-tour-${tenantId}`) || '{"done":[],"hidden":false}')
      : { done: [], hidden: false }
  );

  useEffect(() => {
    if (!tenantId) return;
    fetch(`${BASE}/v1/public/demo-access/tour?tenantId=${encodeURIComponent(tenantId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((b) => {
        if (b?.data?.steps) setTour(b.data);
      })
      .catch(() => {});
  }, [tenantId]);

  useEffect(() => {
    if (tenantId) localStorage.setItem(`demo-tour-${tenantId}`, JSON.stringify(state));
  }, [state, tenantId]);

  const done = useMemo(() => new Set(state.done), [state.done]);
  if (!tour || state.hidden) return null;
  const pct = Math.round((done.size / tour.steps.length) * 100);

  return (
    <div
      style={{
        background: 'linear-gradient(90deg,#4f46e5,#7c3aed)',
        color: '#fff',
        padding: '10px 18px',
        fontSize: 13,
        position: 'relative',
        zIndex: 40,
      }}
    >
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 10, maxWidth: 1200, margin: '0 auto' }}
      >
        <MapPin size={15} />
        <strong style={{ whiteSpace: 'nowrap' }}>Demo tour — {tour.hotelName}</strong>
        <div
          style={{
            flex: 1,
            height: 6,
            background: 'rgba(255,255,255,.25)',
            borderRadius: 99,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${pct}%`,
              height: '100%',
              background: '#fff',
              borderRadius: 99,
              transition: 'width .3s',
            }}
          />
        </div>
        <span>
          {done.size}/{tour.steps.length}
        </span>
        <button
          onClick={() => setOpen(!open)}
          style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
        >
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        <button
          onClick={() => setState({ ...state, hidden: true })}
          style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
          title="Hide tour"
        >
          <X size={15} />
        </button>
      </div>
      {open && (
        <ol
          style={{
            maxWidth: 1200,
            margin: '8px auto 0',
            paddingLeft: 20,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '6px 18px',
          }}
        >
          {tour.steps.map((st) => (
            <li key={st.id} style={{ opacity: done.has(st.id) ? 0.6 : 1 }}>
              <label
                style={{ display: 'flex', gap: 8, alignItems: 'flex-start', cursor: 'pointer' }}
              >
                <input
                  type="checkbox"
                  checked={done.has(st.id)}
                  onChange={() =>
                    setState((prev) => {
                      const d = new Set(prev.done);
                      if (d.has(st.id)) d.delete(st.id);
                      else d.add(st.id);
                      return { ...prev, done: [...d] };
                    })
                  }
                />
                <span>
                  <a
                    href={st.link}
                    style={{ color: '#fff', fontWeight: 600, textDecoration: 'underline' }}
                  >
                    {st.title}
                  </a>
                  <div style={{ fontSize: 11, opacity: 0.85 }}>{st.desc}</div>
                </span>
              </label>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
