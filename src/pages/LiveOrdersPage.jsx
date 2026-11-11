import React from 'react';
import { Button, Spin } from 'antd';
import { FireOutlined, ReloadOutlined, ShopOutlined, SmileOutlined } from '@ant-design/icons';
import { useStoreView } from '../context/StoreViewContext';
import { hasSingleStore, useKdsBoard, useNow } from '../hooks/useKdsBoard';
import { ageLevel, formatAge, summarizeBoard } from '../utils/kdsBoard';
import './LiveOrdersPage.css';

const REFRESH_MS = 10000;

const STATUS = {
  NOT_ACCEPTED: { label: 'New', cls: 's-new' },
  PREPARING: { label: 'Cooking', cls: 's-cooking' },
  READY: { label: 'Ready', cls: 's-ready' },
  COLLECTED: { label: 'Collected', cls: 's-done' },
};

function orderTypeLabel(type) {
  const t = String(type || '').toUpperCase();
  if (t.includes('TAKE')) return { text: 'Parcel', parcel: true };
  if (t.includes('DINE')) return { text: 'Eat here', parcel: false };
  return null;
}

function Kpi({ label, value, hint, level }) {
  return (
    <div className={`lo-kpi ${level === 'late' ? 'is-late' : level === 'warn' ? 'is-warn' : ''}`}>
      <div className="lo-kpi-label">{label}</div>
      <div className="lo-kpi-value">{value}</div>
      {hint ? <div className="lo-kpi-hint">{hint}</div> : null}
    </div>
  );
}

function progressText(line) {
  if (line.status !== 'PREPARING') return null;
  const parts = [];
  if (line.toCollect > 0) parts.push(`${line.toCollect} ready`);
  if (line.toMake > 0 && line.toCollect > 0) parts.push(`${line.toMake} still cooking`);
  return parts.length ? parts.join(' · ') : null;
}

function Ticket({ ticket }) {
  const level = ageLevel(ticket.ageMs);
  const type = orderTypeLabel(ticket.order_type);
  return (
    <article className={`lo-ticket ${level === 'late' ? 'is-late' : level === 'warn' ? 'is-warn' : ''}`}>
      <div className="lo-ticket-bar" />
      <header className="lo-ticket-head">
        <div>
          <div className="lo-token">{ticket.kot_code || ticket.order_id || `#${ticket.id}`}</div>
          {type ? <span className={`lo-type ${type.parcel ? 'is-parcel' : ''}`}>{type.text}</span> : null}
        </div>
        <div className="lo-age">
          <div className="lo-age-value">{formatAge(ticket.ageMs)}</div>
          <div className="lo-age-label">waiting</div>
        </div>
      </header>
      <ul className="lo-lines">
        {ticket.lines.map((line) => {
          const status = STATUS[line.status] || { label: line.status || '—', cls: 's-new' };
          const lineType = orderTypeLabel(line.order_type);
          const mixed = lineType && type && lineType.text !== type.text ? lineType.text : null;
          const options = Array.isArray(line.options) ? line.options.filter(Boolean) : [];
          const progress = progressText(line);
          return (
            <li key={line.id} className={`lo-line ${line.status === 'COLLECTED' ? 'is-done' : ''}`}>
              <span className="lo-qty">{line.quantity}×</span>
              <span className="lo-name">{line.item_name || 'Item'}</span>
              <span className={`lo-tag ${status.cls}`}>{status.label}</span>
              {options.length || mixed || progress ? (
                <span className="lo-extra">{[mixed, ...options, progress].filter(Boolean).join(' · ')}</span>
              ) : null}
              {line.note ? <span className="lo-note">Note: {line.note}</span> : null}
            </li>
          );
        })}
      </ul>
    </article>
  );
}

const LiveOrdersPage = () => {
  const { isMultiStore, singleStoreCode } = useStoreView();
  const enabled = hasSingleStore(isMultiStore, singleStoreCode);
  const { board, error, loading, updatedAt, refresh } = useKdsBoard({ enabled, intervalMs: REFRESH_MS });
  const now = useNow(1000);

  const head = (
    <div className="ktr-page-head">
      <div>
        <div className="ktr-kicker">Today</div>
        <h1 className="ktr-page-title">Live orders</h1>
        <div className="ktr-page-sub">What the kitchen is working on right now. View only.</div>
      </div>
      {enabled ? (
        <div className="lo-status">
          <span className="lo-updated" aria-live="off">
            <span className={`lo-dot ${error ? 'is-stale' : ''}`} />
            {updatedAt ? `Updated ${Math.max(0, Math.round((now - updatedAt) / 1000))}s ago` : 'Loading…'}
          </span>
          <Button icon={<ReloadOutlined />} onClick={refresh} loading={loading && Boolean(updatedAt)}>
            Refresh
          </Button>
        </div>
      ) : null}
    </div>
  );

  if (!enabled) {
    return (
      <div className="animate-fade-in">
        {head}
        <div className="ktr-empty">
          <span className="ktr-empty-icon"><ShopOutlined /></span>
          <b>Pick one store to see live orders</b>
          {isMultiStore
            ? 'Live orders are shown one kitchen at a time. Switch to Single store and choose a store in the top bar.'
            : 'Choose a store in the top bar to see its kitchen.'}
        </div>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="animate-fade-in">
        {head}
        {error ? (
          <div className="ktr-empty">
            <b>Could not load live orders</b>
            {error}
          </div>
        ) : (
          <div style={{ display: 'grid', placeItems: 'center', minHeight: 240 }}>
            <Spin size="large" />
          </div>
        )}
      </div>
    );
  }

  const { tickets, finished, kpis } = summarizeBoard(board, now);
  const oldestLevel = ageLevel(kpis.oldestMs);

  return (
    <div className="animate-fade-in">
      {head}
      {error ? (
        <div className="lo-alert" role="status">
          Could not refresh — showing the last update. {error}
        </div>
      ) : null}

      <div className="lo-kpis">
        <Kpi label="In kitchen" value={kpis.inKitchen} hint={kpis.inKitchen === 1 ? 'ticket' : 'tickets'} />
        <Kpi label="Items to make" value={kpis.itemsToMake} hint="still cooking or not started" />
        <Kpi label="At counter" value={kpis.atCounter} hint="ready, waiting for pickup" />
        <Kpi
          label="Oldest wait"
          value={kpis.oldestMs == null ? '—' : formatAge(kpis.oldestMs)}
          hint="min:sec"
          level={kpis.oldestMs == null ? 'ok' : oldestLevel}
        />
        <Kpi label="Over 10 min" value={kpis.late} hint={kpis.late === 1 ? 'ticket' : 'tickets'} level={kpis.late > 0 ? 'late' : 'ok'} />
      </div>

      {tickets.length === 0 ? (
        <div className="ktr-empty">
          <span className="ktr-empty-icon"><SmileOutlined /></span>
          <b>Kitchen is clear</b>
          No open tickets right now.
        </div>
      ) : (
        <div className="lo-grid">
          {tickets.map((ticket) => (
            <Ticket key={ticket.id ?? ticket.order_id} ticket={ticket} />
          ))}
        </div>
      )}

      <div className="lo-foot">
        <FireOutlined /> Oldest first · refreshes every {REFRESH_MS / 1000}s
        {finished > 0 && board.live_window_minutes
          ? ` · ${finished} ticket${finished === 1 ? '' : 's'} finished in the last ${board.live_window_minutes} min`
          : ''}
      </div>
    </div>
  );
};

export default LiveOrdersPage;
