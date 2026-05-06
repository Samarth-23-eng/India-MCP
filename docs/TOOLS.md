# 🛠 India-MCP Tool Index

This index provides a comprehensive list of all tools available across the India-MCP ecosystem.

---

## 📈 Stocks Server
*Server: `india-mcp-stocks`*

### `get_stock_quote`
Get real-time price and trading data.
- **Args**: `{ "symbol": "string" }`
- **Example**:
  ```json
  { "symbol": "RELIANCE" }
  ```

### `get_market_indices`
Get values of NIFTY 50, SENSEX, etc.
- **Args**: `{ "indices": ["NIFTY 50", "SENSEX"] }`

---

## ⚖️ eCourts Server
*Server: `india-mcp-ecourts`*

### `search_case`
Search cases by number and year.
- **Args**: `{ "caseNumber": "string", "filingYear": "string" }`
- **Example**:
  ```json
  { "caseNumber": "123", "filingYear": "2023" }
  ```

### `get_cause_list`
Retrieve courtroom schedules.
- **Args**: `{ "courtCode": "string", "date": "YYYY-MM-DD" }`

---

## 💰 GST Server
*Server: `india-mcp-gst`*

### `validate_gstin`
Verify any Indian GST Number.
- **Args**: `{ "gstin": "string" }`

### `search_hsn_code`
Search for tax codes by description.
- **Args**: `{ "query": "string" }`

---

## 🚆 Railways Server
*Server: `india-mcp-railways`*

### `get_pnr_status`
Check 10-digit PNR status.
- **Args**: `{ "pnr": "string" }`

### `search_trains`
Find trains between stations.
- **Args**: `{ "source": "string", "destination": "string" }`

---

## 🚗 RTO Server
*Server: `india-mcp-rto`*

### `get_vehicle_details`
Decode registration numbers.
- **Args**: `{ "reg_number": "string" }`

---

## 🏦 Banking Server
*Server: `india-mcp-banking`*

### `get_ifsc_details`
Get branch info from IFSC.
- **Args**: `{ "ifsc": "string" }`

### `validate_upi_vpa`
Check if a UPI ID is valid.
- **Args**: `{ "vpa": "string" }`
