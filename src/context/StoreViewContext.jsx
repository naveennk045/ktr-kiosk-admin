import React, { createContext, useContext, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

const StoreViewContext = createContext(null);

function parseCsv(value) {
  return String(value || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

export function StoreViewProvider({ children }) {
  const [viewMode, setViewMode] = useState(localStorage.getItem('KTR_ONE_VIEW_MODE') || 'single');
  const [selectedStoreCodes, setSelectedStoreCodes] = useState(
    parseCsv(localStorage.getItem('KTR_ONE_MULTI_STORE_CODES'))
  );
  const [singleStoreCode, setSingleStoreCodeState] = useState(
    localStorage.getItem('KIOSK_STORE_CODE') || localStorage.getItem('KIOSK_STORE_ID') || ''
  );

  const updateViewMode = (mode) => {
    const next = mode === 'multi' ? 'multi' : 'single';
    localStorage.setItem('KTR_ONE_VIEW_MODE', next);
    setViewMode(next);
  };

  const updateSelectedStoreCodes = (codes) => {
    const next = Array.isArray(codes) ? codes.filter(Boolean) : [];
    localStorage.setItem('KTR_ONE_MULTI_STORE_CODES', next.join(','));
    setSelectedStoreCodes(next);
  };

  const updateSingleStoreCode = (code) => {
    localStorage.setItem('KIOSK_STORE_CODE', code);
    localStorage.removeItem('KIOSK_STORE_ID');
    setSingleStoreCodeState(code);
  };

  const value = useMemo(
    () => ({
      viewMode,
      setViewMode: updateViewMode,
      selectedStoreCodes,
      setSelectedStoreCodes: updateSelectedStoreCodes,
      singleStoreCode,
      setSingleStoreCode: updateSingleStoreCode,
      isMultiStore: viewMode === 'multi',
    }),
    [viewMode, selectedStoreCodes, singleStoreCode]
  );

  return <StoreViewContext.Provider value={value}>{children}</StoreViewContext.Provider>;
}

export function useStoreView() {
  const ctx = useContext(StoreViewContext);
  if (!ctx) {
    throw new Error('useStoreView must be used within StoreViewProvider');
  }
  return ctx;
}

StoreViewProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

