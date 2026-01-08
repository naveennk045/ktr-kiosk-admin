export const mockOrders = [
  {
    key: '1',
    id: "KTR-80F0A9B176",
    store_id: "Palas Kiosk",
    type: "DINEIN", // Mapped from OrderType
    items_string: '[{"quantity": 2, "item_name": "Bangaluru Benne", "unit_price": 160.0}, {"quantity": 1, "item_name": "Coffee", "unit_price": 80.0}]',
    amount: 420.00,
    created_at: "2026-01-08T04:12:39Z",
    payment_status: "PENDING", // Mapped from PaymentStatus
    erp_status: "NOT_POSTED", // Mapped from KdsStatus
    gateway_response_string: '{"code": "SUCCESS", "data": {"transactionId": "TXN_123456789"}, "message": "Request completed", "provider": "PhonePe"}'
  },
  {
    key: '2',
    id: "KTR-99X1Y2Z345",
    store_id: "Palas Kiosk",
    type: "TAKEAWAY",
    items_string: '[{"quantity": 1, "item_name": "Masala Dosa", "unit_price": 120.0}]',
    amount: 120.00,
    created_at: "2026-01-08T05:30:15Z",
    payment_status: "COMPLETED",
    erp_status: "POSTED",
    gateway_response_string: '{"code": "SUCCESS", "data": {"transactionId": "TXN_987654321"}, "message": "Payment success"}'
  },
  {
    key: '3',
    id: "KTR-77A1B2C3D4",
    store_id: "Palas Kiosk",
    type: "DINEIN",
    items_string: '[{"quantity": 1, "item_name": "Rava Idli", "unit_price": 90.0}]',
    amount: 90.00,
    created_at: "2026-01-08T06:15:00Z",
    payment_status: "FAILED",
    erp_status: "FAILED",
    gateway_response_string: '{"code": "FAILURE", "error": "Insufficient Funds"}'
  }
];
