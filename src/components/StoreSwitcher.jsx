import React, { useEffect, useRef, useState } from 'react';
import { ShopOutlined, CheckOutlined, LoadingOutlined, GlobalOutlined, DownOutlined } from '@ant-design/icons';
import api from '../api';
import { useStoreView } from '../context/StoreViewContext';
import { brand } from '../theme';

const StoreSwitcher = () => {
  const { viewMode, setViewMode, selectedStoreCodes, setSelectedStoreCodes, singleStoreCode, setSingleStoreCode } = useStoreView();
  const [open, setOpen] = useState(false);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const ref = useRef(null);
  const isMulti = viewMode === 'multi';

  /* ── fetch stores once ── */
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await api.get('/admin/stores', { params: { active_only: true } });
        const rows = Array.isArray(res.data) ? res.data : [];
        if (!cancelled) setStores(rows);
      } catch {
        if (!cancelled) setStores([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  /* ── close on outside click ── */
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ── helpers ── */
  const toggleStore = (code) => {
    if (!isMulti) {
      setSingleStoreCode(code);
      setOpen(false);
      window.location.reload();
      return;
    }
    if (selectedStoreCodes.includes(code)) {
      setSelectedStoreCodes(selectedStoreCodes.filter((c) => c !== code));
    } else {
      setSelectedStoreCodes([...selectedStoreCodes, code]);
    }
  };

  const activeLabel = () => {
    if (loading) return 'Loading…';
    if (isMulti) {
      const count = selectedStoreCodes.length;
      return count === 0 ? 'All stores' : `${count} store${count > 1 ? 's' : ''}`;
    }
    // single
    if (singleStoreCode) {
      const st = stores.find((s) => s.store_code === singleStoreCode);
      return st ? st.store_name : singleStoreCode;
    }
    return 'Select a store';
  };

  return (
    <div ref={ref} style={{ position: 'relative', userSelect: 'none' }}>
      {/* ── Trigger button ── */}
      <button
        onClick={() => setOpen((p) => !p)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: open
            ? 'rgba(250, 119, 0,0.12)'
            : 'rgba(250, 119, 0,0.06)',
          border: '1px solid rgba(250, 119, 0,0.20)',
          borderRadius: 10,
          padding: '7px 14px 7px 10px',
          cursor: 'pointer',
          transition: 'all 0.18s ease',
          outline: 'none',
          minWidth: 150,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(250, 119, 0,0.12)';
          e.currentTarget.style.borderColor = 'rgba(250, 119, 0,0.35)';
        }}
        onMouseLeave={(e) => {
          if (!open) {
            e.currentTarget.style.background = 'rgba(250, 119, 0,0.06)';
            e.currentTarget.style.borderColor = 'rgba(250, 119, 0,0.20)';
          }
        }}
      >
        {/* icon */}
        <span style={{
          width: 28, height: 28,
          background: 'linear-gradient(135deg,var(--ktr-orange),var(--ktr-yellow))',
          borderRadius: 7,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {isMulti
            ? <GlobalOutlined style={{ color: '#fff', fontSize: 13 }} />
            : <ShopOutlined style={{ color: '#fff', fontSize: 13 }} />}
        </span>

        {/* label stack */}
        <span style={{ flex: 1, textAlign: 'left' }}>
          <span style={{ display: 'block', fontSize: 10, color: brand.orange, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', lineHeight: 1 }}>
            {isMulti ? 'Multi-store' : 'Single store'}
          </span>
          <span style={{ display: 'block', fontSize: 13, color: brand.ink, fontWeight: 600, marginTop: 2, lineHeight: 1 }}>
            {loading ? <LoadingOutlined style={{ fontSize: 11 }} /> : activeLabel()}
          </span>
        </span>

        {/* caret */}
        <DownOutlined style={{
          fontSize: 10, color: brand.orange, flexShrink: 0,
          transform: open ? 'rotate(180deg)' : 'rotate(0)',
          transition: 'transform 0.18s ease',
        }} />
      </button>

      {/* ── Dropdown panel ── */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            zIndex: 9999,
            background: '#1f1917',
            border: '1px solid var(--ktr-line)',
            borderRadius: 14,
            boxShadow: '0 16px 48px -8px rgba(0, 0, 0, 0.8)',
            minWidth: 240,
            overflow: 'hidden',
            animation: 'storeDrop 0.18s ease',
          }}
        >
          {/* header */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--ktr-paper)' }}>
            <p style={{ margin: 0, fontSize: 11, color: brand.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Switch View
            </p>
          </div>

          {/* mode toggle row */}
          <div style={{ padding: '10px 14px', display: 'flex', gap: 8, borderBottom: '1px solid var(--ktr-paper)' }}>
            {['single', 'multi'].map((mode) => (
              <button
                key={mode}
                onClick={() => {
                  setViewMode(mode);
                  if (mode === 'single') setSelectedStoreCodes([]);
                }}
                style={{
                  flex: 1,
                  padding: '6px 0',
                  border: '1px solid',
                  borderColor: viewMode === mode ? brand.orange : brand.line,
                  borderRadius: 8,
                  background: viewMode === mode ? brand.orange : 'transparent',
                  color: viewMode === mode ? '#fff' : brand.muted,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
              >
                {mode === 'single' ? 'Single' : 'Multi'}
              </button>
            ))}
          </div>

          {/* store list */}
          <div style={{ maxHeight: 240, overflowY: 'auto', padding: '6px 0' }}>
            {loading ? (
              <div style={{ padding: '16px', textAlign: 'center', color: brand.muted, fontSize: 13 }}>
                <LoadingOutlined /> Loading stores…
              </div>
            ) : stores.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: brand.muted, fontSize: 13 }}>
                No stores found
              </div>
            ) : (
              stores.map((store) => {
                const selected = isMulti 
                  ? selectedStoreCodes.includes(store.store_code)
                  : singleStoreCode === store.store_code;

                return (
                  <button
                    key={store.store_code}
                    onClick={() => toggleStore(store.store_code)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '9px 16px',
                      border: 'none',
                      background: selected ? 'rgba(250, 119, 0,0.07)' : 'transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.15s ease',
                      outline: 'none',
                      fontFamily: 'inherit',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(250, 119, 0,0.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = selected ? 'rgba(250, 119, 0,0.07)' : 'transparent';
                    }}
                  >
                    {/* store icon */}
                    <span style={{
                      width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                      background: selected
                        ? 'linear-gradient(135deg,var(--ktr-orange),var(--ktr-yellow))'
                        : brand.paper,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'background 0.15s ease',
                    }}>
                      <ShopOutlined style={{ fontSize: 14, color: selected ? '#fff' : brand.muted }} />
                    </span>

                    {/* store info */}
                    <span style={{ flex: 1 }}>
                      <span style={{ display: 'block', fontSize: 13, color: brand.ink, fontWeight: 600, lineHeight: 1 }}>
                        {store.store_name}
                      </span>
                      <span style={{ display: 'block', fontSize: 11, color: brand.muted, marginTop: 2 }}>
                        {store.store_code}
                      </span>
                    </span>

                    {/* checkmark */}
                    {selected && (
                      <CheckOutlined style={{ fontSize: 12, color: brand.orange, flexShrink: 0 }} />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* footer hint */}
          {isMulti && (
            <div style={{ padding: '10px 16px', borderTop: '1px solid var(--ktr-paper)', fontSize: 11, color: brand.muted, textAlign: 'center' }}>
              {selectedStoreCodes.length === 0
                ? 'No filter — showing all stores'
                : `${selectedStoreCodes.length} store${selectedStoreCodes.length > 1 ? 's' : ''} selected`}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes storeDrop {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default StoreSwitcher;
