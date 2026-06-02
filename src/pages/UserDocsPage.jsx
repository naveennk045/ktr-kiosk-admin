import React from 'react';
import { Card, Typography, Divider, Collapse, Space, List, Tag } from 'antd';
import { BookOutlined, RocketOutlined, DashboardOutlined, TransactionOutlined, ShoppingOutlined, SettingOutlined, BankOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

const UserDocsPage = () => {
  return (
    <div className="animate-fade-in" style={{ paddingBottom: 24, maxWidth: 900, margin: '0 auto' }}>
      <Space align="center" style={{ marginBottom: 4 }}>
        <BookOutlined style={{ color: '#6366F1' }} />
        <Text style={{ color: '#6366F1', fontWeight: 800, fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase' }}>
          Documentation
        </Text>
      </Space>
      <Title level={2} style={{ margin: 0, color: '#0F172A', fontSize: '28px', fontWeight: 800 }}>
        User Guide
      </Title>
      <Paragraph type="secondary" style={{ marginTop: 8, fontSize: '15px' }}>
        Learn how to use the KTR-ONE admin dashboard to manage your stores, view analytics, and control your operations.
      </Paragraph>

      <Card className="premium-card" style={{ marginTop: 24, borderRadius: 16 }}>
        <Collapse ghost defaultActiveKey={['1']} expandIconPosition="end">
          <Panel 
            header={<span style={{ fontWeight: 600, fontSize: '16px' }}><DashboardOutlined style={{ marginRight: 8, color: '#6366F1' }} /> Dashboard & Analytics</span>} 
            key="1"
          >
            <Paragraph>
              The <strong>Dashboard</strong> provides a high-level overview of your sales performance. 
            </Paragraph>
            <List
              size="small"
              dataSource={[
                'Total Revenue, Orders, and Average Order Value (AOV).',
                'Visual charts showing hourly order volume and revenue.',
                'Payment method breakdown (QR, Card, Cash).',
                'Filter analytics by single store or aggregate multiple stores using the top store switcher.',
                'Select custom time periods (Today, Yesterday, Last Week, etc.) using the top right period control.'
              ]}
              renderItem={(item) => <List.Item><Text>{item}</Text></List.Item>}
            />
          </Panel>

          <Panel 
            header={<span style={{ fontWeight: 600, fontSize: '16px' }}><TransactionOutlined style={{ marginRight: 8, color: '#6366F1' }} /> Transactions</span>} 
            key="2"
          >
            <Paragraph>
              The <strong>Transactions</strong> page allows you to view and filter all detailed orders.
            </Paragraph>
            <List
              size="small"
              dataSource={[
                'Click "View details" to open a slide-out drawer with a complete breakdown of the order (items, taxes, payments).',
                'Filter orders by Order Type (Dine-in, Takeaway).',
                'Filter by Payment Method and Payment Status.',
                'Search for specific orders by Order ID or KOT Code.',
                'Filter by PineLabs Terminal ID or Amount ranges.',
                'Sort by date or total amount.'
              ]}
              renderItem={(item) => <List.Item><Text>{item}</Text></List.Item>}
            />
          </Panel>

          <Panel 
            header={<span style={{ fontWeight: 600, fontSize: '16px' }}><ShoppingOutlined style={{ marginRight: 8, color: '#6366F1' }} /> Item & Category Analysis</span>} 
            key="3"
          >
            <Paragraph>
              The <strong>Product Performance</strong> page offers item-level and category-level sales analytics to help you identify bestseller trends, optimize pricing, and evaluate category popularity.
            </Paragraph>
            <List
              size="small"
              dataSource={[
                'Item Analysis: Rank all individual menu items by quantity sold, revenue contribution, and unique order counts.',
                'Category Analysis: Aggregate sales across PetPooja categories (e.g., Bengaluru Dose, Wada / Snacks) and track total volume, revenue, and order frequencies per category.',
                'Interactive Visualizations: View category revenue distribution via interactive Pie Charts and compare units vs. revenue using dual-axis Bar Charts.',
                'Drill Down: Expand any category row in the table to display a small, nested breakdown of specific items sold under that category.'
              ]}
              renderItem={(item) => <List.Item><Text>{item}</Text></List.Item>}
            />
          </Panel>

          <Panel 
            header={<span style={{ fontWeight: 600, fontSize: '16px' }}><BankOutlined style={{ marginRight: 8, color: '#6366F1' }} /> Accounting & Settlement</span>} 
            key="4"
          >
            <Paragraph>
              The <strong>Accounting</strong> module simplifies daily reconciliation.
            </Paragraph>
            <List
              size="small"
              dataSource={[
                'View Gross vs Net Sales and total tax collected.',
                'See payment splits (e.g. PineLabs totals vs Cash collected).',
                'Breakdown by individual POS terminal for easier drawer balancing at the end of the shift.'
              ]}
              renderItem={(item) => <List.Item><Text>{item}</Text></List.Item>}
            />
          </Panel>

          <Panel 
            header={<span style={{ fontWeight: 600, fontSize: '16px' }}><SettingOutlined style={{ marginRight: 8, color: '#6366F1' }} /> Configuration & Menu</span>} 
            key="5"
          >
            <Paragraph>
              The <strong>Config</strong> section controls your kiosk and menu settings.
            </Paragraph>
            <List
              size="small"
              dataSource={[
                'Toggle availability (In Stock / Out of Stock) for specific items in real-time.',
                'Changes reflect instantly on the kiosk screens.',
                'Refresh your PetPooja menu catalog manually.'
              ]}
              renderItem={(item) => <List.Item><Text>{item}</Text></List.Item>}
            />
          </Panel>
        </Collapse>
      </Card>

      <div style={{ textAlign: 'center', marginTop: 40, color: '#94A3B8' }}>
        <RocketOutlined style={{ fontSize: 24, marginBottom: 8 }} />
        <Paragraph style={{ color: '#94A3B8' }}>KTR-ONE System version 1.0.0</Paragraph>
      </div>
    </div>
  );
};

export default UserDocsPage;
