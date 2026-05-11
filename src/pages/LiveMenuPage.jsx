import React, { useEffect, useState, useMemo } from 'react';
import { Card, Row, Col, Typography, Spin, Space, Tag, message, Switch, Button, Divider, Empty } from 'antd';
import {
  RocketOutlined,
  SaveOutlined,
  CheckCircleOutlined,
  AppstoreOutlined,
  ClearOutlined,
  CheckSquareOutlined,
} from '@ant-design/icons';
import api from '../api';

const { Title, Text } = Typography;

const LiveMenuPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [templateData, setTemplateData] = useState({ items: [], categories: [] });
  const [selectedItemIds, setSelectedItemIds] = useState(new Set());

  useEffect(() => {
    fetchTemplateMenu();
  }, []);

  const fetchTemplateMenu = async () => {
    setLoading(true);
    try {
      const response = await api.get('/itemdetails/');
      const data = response.data;
      
      const items = data.items || [];
      const categories = data.categories || [];
      
      setTemplateData({ items, categories });
      
      // By default, let's select all items initially
      const initialIds = new Set(items.map(item => item.itemid));
      setSelectedItemIds(initialIds);
    } catch (err) {
      console.error('Failed to fetch template menu', err);
      message.error('Failed to load the base menu template.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleItem = (itemId, checked) => {
    setSelectedItemIds(prev => {
      const next = new Set(prev);
      if (checked) {
        next.add(itemId);
      } else {
        next.delete(itemId);
      }
      return next;
    });
  };

  const handleToggleCategory = (categoryId, checked) => {
    const categoryItems = templateData.items.filter(i => i.item_categoryid === categoryId);
    
    setSelectedItemIds(prev => {
      const next = new Set(prev);
      categoryItems.forEach(item => {
        if (checked) {
          next.add(item.itemid);
        } else {
          next.delete(item.itemid);
        }
      });
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedItemIds(new Set(templateData.items.map(i => i.itemid)));
  };

  const handleClearAll = () => {
    setSelectedItemIds(new Set());
  };

  const handlePublish = async () => {
    if (selectedItemIds.size === 0) {
      message.warning('Please select at least one item to publish.');
      return;
    }

    setSaving(true);
    try {
      // Filter original data to include only selected items
      const selectedItems = templateData.items.filter(item => selectedItemIds.has(item.itemid));
      
      // Extract unique category IDs from selected items
      const selectedCategoryIds = new Set(selectedItems.map(item => item.item_categoryid));
      
      // Filter original categories to include only those that have selected items
      const selectedCategories = templateData.categories.filter(cat => selectedCategoryIds.has(cat.categoryid));
      
      const payload = {
        items: selectedItems,
        categories: selectedCategories
      };

      await api.post('/itemdetails/', payload);
      message.success({
        content: 'Live menu updated successfully! The kiosk catalog cache has been refreshed.',
        icon: <CheckCircleOutlined style={{ color: '#10B981' }} />
      });
    } catch (err) {
      console.error('Failed to publish live menu', err);
      // Log validation errors if 422 Unprocessable Entity
      if (err.response?.status === 422) {
        message.error('Validation Error: Payload structure is strictly enforced.');
      } else {
        message.error('Failed to publish the live menu. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  // Group items by category
  const groupedItems = useMemo(() => {
    const grouped = {};
    templateData.categories.forEach(cat => {
      grouped[cat.categoryid] = {
        ...cat,
        items: templateData.items.filter(item => item.item_categoryid === cat.categoryid)
      };
    });
    return Object.values(grouped).filter(group => group.items.length > 0);
  }, [templateData]);

  return (
    <Spin spinning={loading} delay={200} tip="Loading Template Menu...">
      <div style={{ paddingBottom: 24, animation: 'fadeIn 0.5s ease-out' }}>
        {/* Header Section */}
        <div
          className="glass-panel"
          style={{
            padding: '24px 32px',
            borderRadius: 16,
            marginBottom: 24,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(255, 255, 255, 0.95) 55%)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            boxShadow: '0 4px 24px -6px rgba(16, 185, 129, 0.1)',
            position: 'sticky',
            top: 80,
            zIndex: 90,
            backdropFilter: 'blur(12px)',
          }}
        >
          <div>
            <Space align="center" style={{ marginBottom: 8 }} wrap>
              <Tag
                icon={<RocketOutlined />}
                color="emerald"
                style={{ borderRadius: 20, fontWeight: 700, border: 'none', padding: '4px 14px', background: '#10B981', color: '#fff' }}
              >
                Immediate Availability
              </Tag>
            </Space>
            <Title level={2} style={{ margin: 0, color: '#0F172A', fontSize: 26, fontWeight: 800 }}>
              Live Menu Manager
            </Title>
            <Text type="secondary" style={{ fontSize: 14 }}>
              Quickly toggle item availability to set up a targeted live menu for your kiosk.
            </Text>
          </div>
          
          <Space size="middle">
            <Button 
              icon={<ClearOutlined />} 
              onClick={handleClearAll}
              disabled={selectedItemIds.size === 0}
              style={{ borderRadius: 8, fontWeight: 600 }}
            >
              Clear All
            </Button>
            <Button 
              icon={<CheckSquareOutlined />} 
              onClick={handleSelectAll}
              disabled={selectedItemIds.size === templateData.items.length && templateData.items.length > 0}
              style={{ borderRadius: 8, fontWeight: 600 }}
            >
              Select All
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handlePublish}
              loading={saving}
              style={{
                borderRadius: 8,
                background: 'linear-gradient(90deg, #10B981, #059669)',
                border: 'none',
                fontWeight: 700,
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                height: 40,
                padding: '0 24px'
              }}
            >
              Publish Live Menu
            </Button>
          </Space>
        </div>

        {/* Content Section */}
        {groupedItems.length === 0 && !loading ? (
          <Empty description="No categories or items found in the template." style={{ margin: '60px 0' }} />
        ) : (
          <Row gutter={[24, 24]}>
            {groupedItems.map(category => {
              const catItems = category.items;
              const selectedCount = catItems.filter(i => selectedItemIds.has(i.itemid)).length;
              const isAllSelected = selectedCount === catItems.length && catItems.length > 0;

              return (
                <Col xs={24} key={category.categoryid}>
                  <Card 
                    className="premium-card" 
                    styles={{ body: { padding: 0 } }}
                    style={{
                      borderRadius: 16,
                      border: '1px solid rgba(226, 232, 240, 0.8)',
                      overflow: 'hidden',
                      boxShadow: '0 2px 12px -4px rgba(15, 23, 42, 0.05)'
                    }}
                  >
                    {/* Category Header */}
                    <div style={{
                      padding: '16px 24px',
                      background: 'rgba(248, 250, 252, 0.8)',
                      borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <Space>
                        <div style={{
                          background: '#E0E7FF',
                          color: '#4F46E5',
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 18,
                        }}>
                          <AppstoreOutlined />
                        </div>
                        <div>
                          <Text strong style={{ fontSize: 16, color: '#1E293B', display: 'block' }}>
                            {category.categoryname}
                          </Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {selectedCount} of {catItems.length} available
                          </Text>
                        </div>
                      </Space>
                      
                      <Space>
                        <Text strong style={{ fontSize: 13, color: isAllSelected ? '#10B981' : '#64748B' }}>
                          {isAllSelected ? 'Category Active' : 'Toggle Category'}
                        </Text>
                        <Switch 
                          checked={isAllSelected} 
                          onChange={(checked) => handleToggleCategory(category.categoryid, checked)}
                          style={{ background: isAllSelected ? '#10B981' : undefined }}
                        />
                      </Space>
                    </div>

                    {/* Items Grid */}
                    <div style={{ padding: '24px' }}>
                      <Row gutter={[16, 16]}>
                        {catItems.map(item => {
                          const isSelected = selectedItemIds.has(item.itemid);
                          return (
                            <Col xs={24} sm={12} md={8} xl={6} key={item.itemid}>
                              <div style={{
                                padding: '16px',
                                borderRadius: 12,
                                border: `1px solid ${isSelected ? 'rgba(16, 185, 129, 0.4)' : 'rgba(226, 232, 240, 0.8)'}`,
                                background: isSelected ? 'rgba(16, 185, 129, 0.04)' : '#FFFFFF',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                height: '100%',
                                boxShadow: isSelected ? '0 4px 12px -4px rgba(16, 185, 129, 0.15)' : 'none'
                              }}>
                                <div style={{ flex: 1, paddingRight: 12 }}>
                                  <Text strong style={{ 
                                    display: 'block', 
                                    color: isSelected ? '#0F172A' : '#64748B',
                                    marginBottom: 4,
                                    fontSize: 14
                                  }}>
                                    {item.itemname}
                                  </Text>
                                  <Text style={{ 
                                    color: isSelected ? '#059669' : '#94A3B8', 
                                    fontWeight: 600,
                                    fontSize: 13 
                                  }}>
                                    ₹{Number(item.price).toFixed(2)}
                                  </Text>
                                </div>
                                <Switch 
                                  checked={isSelected}
                                  onChange={(checked) => handleToggleItem(item.itemid, checked)}
                                  size="small"
                                  style={{ background: isSelected ? '#10B981' : undefined, marginTop: 4 }}
                                />
                              </div>
                            </Col>
                          );
                        })}
                      </Row>
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}
      </div>
      
      <style jsx="true">{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </Spin>
  );
};

export default LiveMenuPage;
