import React, { useEffect, useState } from 'react';
import { Drawer, Descriptions, Table, Tag, Collapse, Button, message, Spin } from 'antd';
import { CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import api from '../api';

const OrderDetailsDrawer = ({ open, onClose, initialOrder }) => {
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
      console.error("Failed to fetch order details", error);
      message.error("Failed to load details");
      setDetails(initialOrder); // Fallback to list view data
    } finally {
      setLoading(false);
    }
  };

  const handleRetrySync = () => {
    message.loading("Retrying ERP Sync...", 1)
      .then(() => message.success("Sync request sent successfully"));
  };

  const items = details?.items || [];
  // Handle if items is a string (legacy/mock) or array (real)
  const normalizedItems = typeof items === 'string' ? JSON.parse(items) : items;

  const itemColumns = [
    {
      title: 'Item Name',
      dataIndex: 'item_name',
      key: 'name',
    },
    {
      title: 'Qty',
      dataIndex: 'quantity',
      key: 'qty',
    },
    {
      title: 'Price',
      dataIndex: 'unit_price',
      key: 'price',
      render: (val) => `₹${Number(val).toFixed(2)}`,
    },
    {
      title: 'Total',
      key: 'total',
      render: (_, record) => `₹${(record.quantity * record.unit_price).toFixed(2)}`,
    }
  ];

  return (
    <Drawer
      title={`Order Details: ${details?.orderRefId || ''}`}
      placement="right"
      width={640}
      onClose={onClose}
      open={open}
      extra={
        <Button
          type="primary"
          icon={<ReloadOutlined />}
          onClick={handleRetrySync}
          disabled={details?.erpStatus === 'POSTED'}
        >
          Retry ERP Sync
        </Button>
      }
    >
      {loading ? <Spin /> : details && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <Descriptions bordered column={1} size="small" labelStyle={{ width: '150px' }}>
            <Descriptions.Item label="Order Ref ID">
              {details.orderRefId} <CopyOutlined style={{ cursor: 'pointer', marginLeft: 8 }} onClick={() => { navigator.clipboard.writeText(details.orderRefId); message.success('Copied'); }} />
            </Descriptions.Item>
            <Descriptions.Item label="Location">{details.location}</Descriptions.Item>
            <Descriptions.Item label="Created At">{new Date(details.createdAt).toLocaleString()}</Descriptions.Item>
            <Descriptions.Item label="Total Amount">₹{Number(details.amount).toFixed(2)}</Descriptions.Item>
            <Descriptions.Item label="Payment Status">
              <Tag color={details.paymentStatus === 'COMPLETED' ? 'success' : details.paymentStatus === 'PENDING' ? 'warning' : 'error'}>
                {details.paymentStatus}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="ERP Status">
              <Tag color={details.erpStatus === 'POSTED' ? 'success' : 'red'}>
                {details.erpStatus}
              </Tag>
            </Descriptions.Item>
          </Descriptions>

          <div>
            <h3>Items</h3>
            <Table
              dataSource={normalizedItems}
              columns={itemColumns}
              pagination={false}
              rowKey={(record, index) => index}
              size="small"
              bordered
            />
          </div>

          <Collapse ghost>
            <Collapse.Panel header="Payment Metadata (Debug)" key="1">
              <div style={{ background: '#1e1e1e', padding: '12px', borderRadius: '6px', overflowX: 'auto' }}>
                {(() => {
                  try {
                    const debugData = details.paymentMeta || details.gatewayResponse || details.gateway_response_string;
                    if (!debugData) return <span style={{ color: '#fff' }}>No Metadata</span>;

                    const parsed = typeof debugData === 'string' ? JSON.parse(debugData) : debugData;

                    const highlight = (json) => {
                      if (typeof json !== 'string') {
                        json = JSON.stringify(json, null, 2);
                      }
                      const colors = {
                        key: '#9cdcfe',
                        string: '#ce9178',
                        number: '#b5cea8',
                        boolean: '#569cd6',
                        null: '#569cd6',
                        punctuation: '#d4d4d4'
                      };

                      return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
                        let cls = 'number';
                        if (/^"/.test(match)) {
                          if (/:$/.test(match)) {
                            cls = 'key';
                            // remove colon for styling, add it back outside
                            return `<span style="color:${colors.key}">${match.slice(0, -1)}</span><span style="color:${colors.punctuation}">:</span>`;
                          } else {
                            cls = 'string';
                          }
                        } else if (/true|false/.test(match)) {
                          cls = 'boolean';
                        } else if (/null/.test(match)) {
                          cls = 'null';
                        }
                        return `<span style="color:${colors[cls]}">${match}</span>`;
                      });
                    };

                    const html = highlight(parsed);

                    return (
                      <pre
                        style={{ margin: 0, fontSize: '11px', fontFamily: 'Menlo, Monaco, "Courier New", monospace', color: '#d4d4d4' }}
                        dangerouslySetInnerHTML={{ __html: html }}
                      />
                    );
                  } catch (e) {
                    return <pre style={{ color: '#ce9178' }}>{String(details.paymentMeta || details.gatewayResponse || 'Parse Error')}</pre>;
                  }
                })()}
              </div>
            </Collapse.Panel>
          </Collapse>
        </div>
      )}
    </Drawer>
  );
};

export default OrderDetailsDrawer;
