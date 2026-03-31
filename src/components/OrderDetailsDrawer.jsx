import React, { useEffect, useState, useMemo } from 'react';
import {
  Drawer,
  Descriptions,
  Table,
  Tag,
  Collapse,
  Button,
  message,
  Spin,
  Typography,
  Space,
  Divider,
  Tooltip,
  theme,
} from 'antd';
import {
  CopyOutlined,
  ReloadOutlined,
  ShoppingOutlined,
  InfoCircleOutlined,
  CodeOutlined,
  CheckCircleFilled,
} from '@ant-design/icons';
import api from '../api';
import {
  formatInr,
  formatIst,
  getKotCode,
  getOrderType,
  getPaymentType,
  lineTitle,
  lineQty,
  lineUnitPrice,
  lineLineTotal,
  pickFirst,
} from '../utils/orderFields';

const { Title, Text } = Typography;
const { useToken } = theme;

function pickSku(row) {
  const s = pickFirst(row, ['sku_code', 'skuCode', 'sku', 'item_sku', 'itemSku']);
  return s != null && String(s).trim() !== '' ? String(s) : null;
}

const OrderDetailsDrawer = ({ open, onClose, initialOrder }) => {
  const { token } = useToken();
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState(null);

  useEffect(() => {
    if (open && initialOrder?.orderRefId) {
      fetchDetails(initialOrder.orderRefId);
    } else {
      setDetails(null);
    }
  }, [open, initialOrder]);

  const fetchDetails = async (id) => {
    setLoading(true);
    try {
      const response = await api.get(`/orders/${id}`);
      setDetails(response.data);
    } catch (error) {
      console.error('Failed to fetch order details', error);
      message.error('Failed to load details');
      setDetails(initialOrder);
    } finally {
      setLoading(false);
    }
  };

  const handleRetrySync = () => {
    message.loading('Retrying ERP Sync…', 1).then(() => message.success('Sync request sent'));
  };

  const normalizedItems = useMemo(() => {
    const raw = details?.items;
    if (raw == null) return [];
    if (typeof raw === 'string') {
      try {
        return JSON.parse(raw);
      } catch {
        return [];
      }
    }
    return Array.isArray(raw) ? raw : [];
  }, [details]);

  const linesComputed = useMemo(() => {
    return normalizedItems.map((row, index) => {
      const qty = lineQty(row);
      const unit = lineUnitPrice(row);
      const total = lineLineTotal(row);
      return { ...row, _idx: index, _qty: qty, _unit: unit, _lineTotal: total };
    });
  }, [normalizedItems]);

  const subtotal = useMemo(
    () => linesComputed.reduce((acc, r) => acc + (Number(r._lineTotal) || 0), 0),
    [linesComputed]
  );

  const itemColumns = useMemo(
    () => [
      {
        title: 'Item',
        key: 'name',
        render: (_, row) => (
          <div>
            <Text strong style={{ color: token.colorText, display: 'block' }}>
              {lineTitle(row)}
            </Text>
            {pickSku(row) ? (
              <Text type="secondary" style={{ fontSize: 11, fontFamily: 'monospace' }}>
                SKU {pickSku(row)}
              </Text>
            ) : null}
          </div>
        ),
      },
      {
        title: 'Qty',
        key: 'qty',
        width: 72,
        align: 'center',
        render: (_, row) => (
          <Text style={{ color: token.colorTextSecondary, fontWeight: 600 }}>{row._qty}</Text>
        ),
      },
      {
        title: 'Unit price',
        key: 'unit',
        width: 110,
        align: 'right',
        render: (_, row) => <Text style={{ color: token.colorTextSecondary }}>{formatInr(row._unit)}</Text>,
      },
      {
        title: 'Line total',
        key: 'line',
        width: 120,
        align: 'right',
        render: (_, row) => (
          <Text style={{ color: token.colorPrimary, fontWeight: 700 }}>{formatInr(row._lineTotal)}</Text>
        ),
      },
    ],
    [token]
  );

  const headerId = details?.orderRefId || '';

  return (
    <Drawer
      title={
        <Space size={12} wrap>
          <ShoppingOutlined style={{ color: token.colorPrimary }} />
          <span style={{ color: token.colorText, fontWeight: 800 }}>Order details</span>
          {headerId ? (
            <Tag
              style={{
                background: token.colorPrimaryBg,
                color: token.colorPrimary,
                border: `1px solid ${token.colorPrimaryBorder}`,
                borderRadius: 4,
                fontFamily: 'ui-monospace, monospace',
              }}
            >
              {headerId}
            </Tag>
          ) : null}
        </Space>
      }
      placement="right"
      width={720}
      onClose={onClose}
      open={open}
      styles={{
        header: {
          borderBottom: `1px solid ${token.colorSplit}`,
          padding: '20px 24px',
        },
        body: { background: token.colorBgLayout, padding: '24px' },
      }}
      extra={
        <Button
          type="primary"
          icon={<ReloadOutlined />}
          onClick={handleRetrySync}
          disabled={details?.erpStatus === 'POSTED'}
          style={{ borderRadius: 8, fontWeight: 600 }}
        >
          Retry sync
        </Button>
      }
    >
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
          <Spin size="large" />
        </div>
      ) : (
        details && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div
              style={{
                background: `linear-gradient(145deg, ${token.colorPrimaryBg} 0%, ${token.colorBgContainer} 55%)`,
                borderRadius: 16,
                border: `1px solid ${token.colorBorderSecondary}`,
                padding: '20px 22px',
              }}
            >
              <Space align="center" style={{ marginBottom: 12 }} wrap>
                <InfoCircleOutlined style={{ color: token.colorPrimary }} />
                <Text strong style={{ color: token.colorText, fontSize: 15 }}>
                  Summary
                </Text>
                <Tag
                  icon={<CheckCircleFilled />}
                  color="success"
                  style={{ marginLeft: 8, fontWeight: 700 }}
                >
                  {details.paymentStatus || '—'}
                </Tag>
              </Space>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                  gap: 16,
                }}
              >
                <div>
                  <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    KOT code
                  </Text>
                  <div style={{ color: token.colorText, fontWeight: 700, marginTop: 4 }}>{getKotCode(details)}</div>
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Order type
                  </Text>
                  <div style={{ marginTop: 4, color: token.colorText }}>{getOrderType(details)}</div>
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Payment type
                  </Text>
                  <div style={{ color: token.colorText, fontWeight: 600, marginTop: 4 }}>{getPaymentType(details)}</div>
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Location
                  </Text>
                  <div style={{ color: token.colorText, marginTop: 4 }}>{details.location || '—'}</div>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Date (IST)
                  </Text>
                  <div style={{ color: token.colorText, marginTop: 4 }}>{formatIst(details.createdAt)}</div>
                </div>
              </div>
              <Divider style={{ margin: '20px 0 16px' }} />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Billed total
                </Text>
                <Title level={3} style={{ margin: 0, color: token.colorText, fontWeight: 800 }}>
                  {formatInr(details.amount)}
                </Title>
              </div>
              {Math.abs(subtotal - Number(details.amount || 0)) > 0.02 && linesComputed.length > 0 ? (
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
                  Line items sum {formatInr(subtotal)} — may differ from billed amount if discounts or taxes apply.
                </Text>
              ) : null}
            </div>

            <div>
              <Space align="center" style={{ marginBottom: 12 }}>
                <ShoppingOutlined style={{ color: token.colorPrimary }} />
                <Text strong style={{ color: token.colorText, fontSize: 16 }}>
                  Line items and pricing
                </Text>
              </Space>
              <div
                style={{
                  background: token.colorBgContainer,
                  borderRadius: 16,
                  border: `1px solid ${token.colorBorderSecondary}`,
                  overflow: 'hidden',
                }}
              >
                <Table
                  dataSource={linesComputed}
                  columns={itemColumns}
                  pagination={false}
                  rowKey={(record) => record._idx}
                  size="middle"
                  locale={{ emptyText: 'No line items' }}
                />
                {linesComputed.length > 0 ? (
                  <div
                    style={{
                      padding: '14px 16px',
                      borderTop: `1px solid ${token.colorBorderSecondary}`,
                      display: 'flex',
                      justifyContent: 'flex-end',
                      gap: 24,
                      alignItems: 'center',
                    }}
                  >
                    <Text type="secondary">Subtotal (lines)</Text>
                    <Text strong style={{ color: token.colorText, fontSize: 16 }}>
                      {formatInr(subtotal)}
                    </Text>
                  </div>
                ) : null}
              </div>
            </div>

            <div
              style={{
                background: token.colorBgContainer,
                borderRadius: 16,
                border: `1px solid ${token.colorBorderSecondary}`,
                overflow: 'hidden',
              }}
            >
              <Descriptions
                column={1}
                size="middle"
                bordered={false}
                labelStyle={{
                  color: token.colorTextSecondary,
                  padding: '12px 20px',
                  width: 180,
                  background: token.colorFillAlter,
                }}
                contentStyle={{ color: token.colorText, padding: '12px 20px' }}
              >
                <Descriptions.Item label="Reference ID">
                  <Space>
                    <span style={{ fontWeight: 700, fontFamily: 'ui-monospace, monospace' }}>{details.orderRefId}</span>
                    <Tooltip title="Copy">
                      <CopyOutlined
                        style={{ cursor: 'pointer', color: token.colorPrimary }}
                        onClick={() => {
                          navigator.clipboard.writeText(details.orderRefId);
                          message.success('Copied');
                        }}
                      />
                    </Tooltip>
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="ERP / KDS">{details.erpStatus || '—'}</Descriptions.Item>
              </Descriptions>
            </div>

            <Collapse
              ghost
              expandIcon={({ isActive }) => (
                <CodeOutlined rotate={isActive ? 90 : 0} style={{ color: token.colorPrimary }} />
              )}
            >
              <Collapse.Panel
                header={<span style={{ color: token.colorTextSecondary, fontWeight: 600 }}>Payment metadata</span>}
                key="1"
              >
                <div
                  style={{
                    background: token.colorFillAlter,
                    padding: '20px',
                    borderRadius: 12,
                    border: `1px solid ${token.colorBorderSecondary}`,
                    overflowX: 'auto',
                  }}
                >
                  {(() => {
                    try {
                      const debugData =
                        details.paymentMeta || details.gatewayResponse || details.gateway_response_string;
                      if (!debugData) {
                        return <span style={{ color: token.colorTextSecondary }}>No metadata</span>;
                      }
                      const parsed = typeof debugData === 'string' ? JSON.parse(debugData) : debugData;
                      return (
                        <pre
                          style={{
                            margin: 0,
                            fontSize: 11,
                            fontFamily: '"Fira Code", ui-monospace, monospace',
                            lineHeight: 1.6,
                            color: token.colorTextSecondary,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                          }}
                        >
                          {JSON.stringify(parsed, null, 2)}
                        </pre>
                      );
                    } catch {
                      return (
                        <pre style={{ color: token.colorError, margin: 0 }}>
                          {String(details.paymentMeta || details.gatewayResponse || 'Parse error')}
                        </pre>
                      );
                    }
                  })()}
                </div>
              </Collapse.Panel>
            </Collapse>
          </div>
        )
      )}
    </Drawer>
  );
};

export default OrderDetailsDrawer;
