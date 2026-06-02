# Developer Integration Guide: Category-wise Sales Analytics

This document details how the Category-wise Analytics feature is integrated into the KTR-ONE admin frontend.

---

## 1. Backend Endpoint Specifications

### GET `/analytics/categories/summary`

Returns a list of all categories that had sales during the requested time window, including aggregate statistics and a nested list of items sold.

#### Headers
- `X-Store-Id` (string, required): The numeric store ID or code (e.g. `1` or `KTR-BANDRA`). Passed automatically by `src/api.js` request interceptor.

#### Query Parameters
- `period` (string, optional, default: `today`): Allowed values: `today`, `yesterday`, `last_week`, `all_time`, `custom_range`.
- `from_date` (string `YYYY-MM-DD`, optional): Required if `period` is `custom_range`.
- `to_date` (string `YYYY-MM-DD`, optional): Required if `period` is `custom_range`.

---

## 2. Response JSON Schema

```json
{
  "period": "today",
  "from_date": null,
  "to_date": null,
  "categories": [
    {
      "category_id": "9534538",
      "category_name": "Bengaluru Dose",
      "total_quantity": 45,
      "total_revenue": 4950.0,
      "order_count": 28,
      "items": [
        {
          "sku": "1301947637",
          "item_name": "Benne Pudi Masala Dose",
          "total_quantity": 25,
          "total_revenue": 2750.0,
          "order_count": 18
        }
      ]
    }
  ]
}
```

---

## 3. Frontend Architecture (`ItemAnalysisPage.jsx`)

The category analytics is structured as a separate view under the `Category Analysis` tab within `/items` (`ItemAnalysisPage`).

### State Management
- `categoriesLoading` (boolean): Controls the spin loader for category analytics.
- `categories` (array): Holds the list of categories returned by the backend.

### Data Aggregations (Calculated in UI)
- **Total Categories Sold**: Derived from `categories.length`.
- **Top Category by Quantity**: The first element of `categories` (since the backend pre-sorts them by `total_quantity` descending).
- **Top Category by Revenue**: Calculated by sorting the categories array on `total_revenue` in descending order.

### Visualizations (`recharts`)
1. **Pie Chart (Revenue Share)**: Renders the distribution of revenue across categories using `Pie`, `Cell`, and `Tooltip`.
2. **Bar Chart (Units & Revenue)**: Employs a dual-axis layout displaying:
   - **Units Sold** on the left Y-axis.
   - **Revenue (₹)** on the right Y-axis.

### Expandable Drill-Down Table (`antd`)
- The main table lists categories: Category Name, Total Qty Sold, Total Revenue, Order Count.
- The `expandable` configuration uses `expandedRowRender` to project a nested, clean table listing individual items within that category (Item Name, SKU, Qty Sold, Revenue, Order Count).

---

## 4. Verification and Local Development

To run the application locally and verify category analytics:

1. Start the React dev server:
   ```bash
   npm run dev
   ```
2. Navigate to `http://localhost:5173/items` in your browser.
3. Toggle between the **Item Analysis** and **Category Analysis** tabs.
4. Alter dates using the period picker in the top header and ensure data updates correctly.
