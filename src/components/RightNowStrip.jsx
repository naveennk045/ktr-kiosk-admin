import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightOutlined, FireOutlined } from '@ant-design/icons';
import { useStoreView } from '../context/StoreViewContext';
import { hasSingleStore, useKdsBoard, useNow } from '../hooks/useKdsBoard';
import { ageLevel, formatAge, summarizeBoard } from '../utils/kdsBoard';
import { brand } from '../theme';
import '../pages/LiveOrdersPage.css';

/** Dashboard strip: the kitchen at this moment for the selected store (hidden in multi-store view). */
const RightNowStrip = () => {
  const { isMultiStore, singleStoreCode } = useStoreView();
  const enabled = hasSingleStore(isMultiStore, singleStoreCode);
  const { board, error } = useKdsBoard({ enabled, intervalMs: 15000 });
  const now = useNow(1000);
  if (!enabled) return null;

  const kpis = board ? summarizeBoard(board, now).kpis : null;
  const level = kpis ? ageLevel(kpis.oldestMs) : 'ok';

  return (
    <section className="rn-strip" aria-label="Right now">
      <div className="rn-title">
        <FireOutlined style={{ color: brand.orange }} /> Right now
      </div>
      {kpis ? (
        <>
          <div className="rn-item">
            <span className="rn-value">{kpis.inKitchen}</span>
            <span className="rn-label">in kitchen</span>
          </div>
          <div className="rn-item">
            <span className="rn-value">{kpis.atCounter}</span>
            <span className="rn-label">at counter</span>
          </div>
          <div className="rn-item">
            <span className={`rn-value ${level === 'late' ? 'is-late' : level === 'warn' ? 'is-warn' : ''}`}>
              {kpis.oldestMs == null ? '—' : formatAge(kpis.oldestMs)}
            </span>
            <span className="rn-label">oldest wait</span>
          </div>
          {error ? <span className="rn-muted">Not refreshing — last known numbers</span> : null}
        </>
      ) : (
        <span className="rn-muted">{error ? 'Live kitchen status is unavailable right now.' : 'Loading…'}</span>
      )}
      <Link className="rn-link" to="/live">
        Live orders <ArrowRightOutlined />
      </Link>
    </section>
  );
};

export default RightNowStrip;
