import React, { useEffect, useState } from 'react';
import { Card, Table, Typography, Space, Tag, Spin, message, Row, Col, Divider } from 'antd';
import { BankOutlined, SafetyCertificateOutlined, CreditCardOutlined, MoneyCollectOutlined } from '@ant-design/icons';
import api from '../api';
import { useDashboardPeriod } from '../context/DashboardPeriodContext';
import { useStoreView } from '../context/StoreViewContext';
import { formatInr } from '../utils/orderFields';
import { formatApiError } from '../utils/formatApiError';

const { Title, Text } = Typography;

const AccountingPage = () => {
  const { period, periodLabel } = useDashboardPeriod();
  const { isMultiStore, selectedStoreCodes } = useStoreView();
  const [loading, setLoading] = useState(false);
  const [settlementData, setSettlementData] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const fetchSettlement = async () => {
      setLoading(true);
      try {
        const response = await api.get('/admin/accounting/settlement', {
          params: {
            period,
            active_only: true,
            store_codes: isMultiStore && selectedStoreCodes.length > 0 ? selectedStoreCodes.join(',') : undefined,
          },
        });
        if (!cancelled) {
          setSettlementData(response.data.stores || []);
        }
      } catch (err) {
        console.error('Failed to fetch settlement data', err);
        if (!cancelled) {
          setSettlementData([]);
          message.error(formatApiError(err));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchSettlement();
    return () => {
      cancelled = true;
    };
  }, [period, isMultiStore, selectedStoreCodes]);

  const pineLabsColumns = [
    { title: 'Terminal ID', dataIndex: 'terminalId', key: 'terminalId', render: (text) => <Text code>{text}</Text> },
    { title: 'Txn Count', dataIndex: 'cardTxnCount', key: 'cardTxnCount', align: 'right' },
    { title: 'Amount', dataIndex: 'cardAmount', key: 'cardAmount', align: 'right', render: (val) => formatInr(val) },
  ];

  const cashColumns = [
    { title: 'Staff Name', dataIndex: 'staffName', key: 'staffName', render: (text) => <Text strong>{text || 'Unknown'}</Text> },
    { title: 'Txn Count', dataIndex: 'cashTxnCount', key: 'cashTxnCount', align: 'right' },
    { title: 'Amount', dataIndex: 'cashAmount', key: 'cashAmount', align: 'right', render: (val) => formatInr(val) },
  ];

  return (
    <Spin spinning={loading}>
      <div style={{ paddingBottom: 24 }}>
        <div
          className="glass-panel"
          style={{
            padding: '28px 32px',
            borderRadius: 16,
            marginBottom: 24,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(255, 255, 255, 0.95) 55%)',
            border: '1px solid rgba(99, 102, 241, 0.15)',
          }}
        >
          <div>
            <Space align="center" style={{ marginBottom: 8 }} wrap>
              <Tag
                icon={<SafetyCertificateOutlined />}
                color="cyan"
                style={{ borderRadius: 20, fontWeight: 700, border: 'none', padding: '2px 12px' }}
              >
                Reconciliation
              </Tag>
              <Text type="secondary" style={{ fontSize: 13 }}>
                Period: <strong style={{ color: '#0F172A' }}>{periodLabel}</strong> (IST)
              </Text>
            </Space>
            <Title level={2} style={{ margin: 0, color: '#0F172A', fontSize: 28, fontWeight: 800 }}>
              Accounting & Settlement
            </Title>
            <Text type="secondary" style={{ fontSize: 15 }}>
              Detailed financial breakdown for reconciliation across stores.
            </Text>
          </div>
        </div>

        {settlementData.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <Text type="secondary">No settlement data available for this period.</Text>
          </div>
        )}

        {settlementData.map((store) => (
          <Card 
            key={store.store_id || store.store_code} 
            className="premium-card" 
            style={{ marginBottom: 24 }}
            title={<span style={{ fontSize: 18, fontWeight: 700 }}>Store: {store.store_code}</span>}
          >
            <Row gutter={[24, 24]}>
              <Col xs={24} md={12}>
                <Title level={5} style={{ marginTop: 0, marginBottom: 16, color: '#475569' }}>
                  <BankOutlined /> Sales Breakdown
                </Title>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>Gross Sales</Text>
                    <Text strong style={{ fontSize: 18 }}>{formatInr(store.grossSales)}</Text>
                  </div>
                  <div>
                    <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>Net Sales</Text>
                    <Text strong style={{ fontSize: 18 }}>{formatInr(store.netSales)}</Text>
                  </div>
                  <div>
                    <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>Total Tax</Text>
                    <Text strong style={{ fontSize: 18, color: '#F59E0B' }}>{formatInr(store.totalTax)}</Text>
                  </div>
                  <div>
                    <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>Takeaway Charges</Text>
                    <Text strong style={{ fontSize: 18 }}>{formatInr(store.takeawayChargesCollected)}</Text>
                  </div>
                </div>

                <Divider />

                <Title level={5} style={{ marginTop: 0, marginBottom: 16, color: '#475569' }}>
                  <CreditCardOutlined /> Tender Mix
                </Title>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                  <div>
                    <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>UPI (QR)</Text>
                    <Text strong style={{ fontSize: 16, color: '#6366F1' }}>{formatInr(store.totalUpi)}</Text>
                  </div>
                  <div>
                    <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>Card (EDC)</Text>
                    <Text strong style={{ fontSize: 16, color: '#6366F1' }}>{formatInr(store.totalCard)}</Text>
                  </div>
                  <div>
                    <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>Cash + Manual</Text>
                    <Text strong style={{ fontSize: 16, color: '#10B981' }}>{formatInr(store.totalCash)}</Text>
                  </div>
                </div>
              </Col>

              <Col xs={24} md={12}>
                <Title level={5} style={{ marginTop: 0, marginBottom: 16, color: '#475569' }}>
                  <CreditCardOutlined /> PineLabs Settlement (Card)
                </Title>
                {store.pineLabsSettlement && store.pineLabsSettlement.length > 0 ? (
                  <Table 
                    dataSource={store.pineLabsSettlement} 
                    columns={pineLabsColumns} 
                    rowKey="terminalId"
                    pagination={false}
                    size="small"
                  />
                ) : (
                  <Text type="secondary">No PineLabs settlement data.</Text>
                )}

                <Divider />

                <Title level={5} style={{ marginTop: 0, marginBottom: 16, color: '#475569' }}>
                  <MoneyCollectOutlined /> Cash Settlement by Staff
                </Title>
                {store.cashSettlement && store.cashSettlement.length > 0 ? (
                  <Table 
                    dataSource={store.cashSettlement} 
                    columns={cashColumns} 
                    rowKey={(record) => record.staffName || Math.random()}
                    pagination={false}
                    size="small"
                  />
                ) : (
                  <Text type="secondary">No Cash settlement data.</Text>
                )}
              </Col>
            </Row>
          </Card>
        ))}
      </div>
    </Spin>
  );
};

export default AccountingPage;
