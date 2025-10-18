# API Documentation

Base URL: `http://localhost:3001/api`

All authenticated endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

## Authentication

### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "username": "admin",
  "password": "password123",
  "email": "admin@example.com",
  "role": "admin"  // optional, defaults to "user"
}
```

**Response:**
```json
{
  "message": "User created successfully",
  "userId": 1
}
```

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

## Products

### Get All Products
```http
GET /products
Authorization: Bearer TOKEN

# Query Parameters (optional):
# - category: Filter by category
# - search: Search in name, SKU, or barcode
```

### Get Product by ID
```http
GET /products/:id
Authorization: Bearer TOKEN
```

### Create Product
```http
POST /products
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "name": "Laptop",
  "description": "High-performance laptop",
  "sku": "LAP-001",
  "barcode": "1234567890123",
  "price": 999.99,
  "cost": 750.00,
  "quantity": 10,
  "min_quantity": 2,
  "category": "Electronics",
  "unit": "piece"
}
```

### Update Product
```http
PUT /products/:id
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "name": "Updated Laptop",
  "price": 899.99
  // Only include fields you want to update
}
```

### Delete Product
```http
DELETE /products/:id
Authorization: Bearer TOKEN
```

### Get Low Stock Products
```http
GET /products/reports/low-stock
Authorization: Bearer TOKEN
```

## Customers

### Get All Customers
```http
GET /customers
Authorization: Bearer TOKEN

# Query Parameters (optional):
# - search: Search in name, email, or phone
```

### Get Customer by ID
```http
GET /customers/:id
Authorization: Bearer TOKEN
```

### Create Customer
```http
POST /customers
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "address": "123 Main St, City",
  "notes": "VIP customer"
}
```

### Update Customer
```http
PUT /customers/:id
Authorization: Bearer TOKEN
Content-Type: application/json
```

### Delete Customer
```http
DELETE /customers/:id
Authorization: Bearer TOKEN
```

### Get Customer Purchase History
```http
GET /customers/:id/purchases
Authorization: Bearer TOKEN
```

## Sales

### Get All Sales
```http
GET /sales
Authorization: Bearer TOKEN

# Query Parameters (optional):
# - startDate: Filter by start date (YYYY-MM-DD)
# - endDate: Filter by end date (YYYY-MM-DD)
# - status: Filter by status
```

### Get Sale by ID
```http
GET /sales/:id
Authorization: Bearer TOKEN
```

### Create Sale
```http
POST /sales
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "customer_id": 1,  // optional
  "items": [
    {
      "product_id": 1,
      "quantity": 2,
      "unit_price": 999.99
    }
  ],
  "payment_method": "cash",
  "notes": "Rush order",
  "discount_amount": 50.00  // optional
}
```

**Response includes QR code:**
```json
{
  "id": 1,
  "invoice_number": "INV-20251018-0001",
  "qr_code": "data:image/png;base64,...",
  "message": "Sale created successfully"
}
```

### Get Sales Summary
```http
GET /sales/reports/summary
Authorization: Bearer TOKEN

# Query Parameters (optional):
# - startDate: Start date
# - endDate: End date
```

## Invoices

### Get All Invoices
```http
GET /invoices
Authorization: Bearer TOKEN

# Query Parameters (optional):
# - type: Filter by type (purchase, proforma, sales)
# - status: Filter by status
```

### Get Invoice by ID
```http
GET /invoices/:id
Authorization: Bearer TOKEN
```

### Create Invoice
```http
POST /invoices
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "customer_id": 1,
  "type": "sales",  // purchase, proforma, or sales
  "total_amount": 1999.98,
  "tax_amount": 200.00,
  "due_date": "2025-11-18",
  "notes": "Net 30 days",
  "status": "draft"  // draft, sent, paid, cancelled
}
```

### Update Invoice
```http
PUT /invoices/:id
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "status": "paid"
}
```

### Delete Invoice
```http
DELETE /invoices/:id
Authorization: Bearer TOKEN
```

## Inventory

### Get Stock Movements
```http
GET /inventory/movements
Authorization: Bearer TOKEN

# Query Parameters (optional):
# - product_id: Filter by product
# - type: Filter by movement type
# - startDate: Start date
# - endDate: End date
```

### Adjust Stock
```http
POST /inventory/adjust
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "product_id": 1,
  "quantity": 10,
  "type": "addition",  // or "removal"
  "reference": "PO-12345",
  "notes": "Received from supplier"
}
```

### Get Inventory Value
```http
GET /inventory/value
Authorization: Bearer TOKEN
```

## Stock Takes

### Get All Stock Takes
```http
GET /stock-takes
Authorization: Bearer TOKEN

# Query Parameters (optional):
# - status: Filter by status (in_progress, completed)
```

### Get Stock Take by ID
```http
GET /stock-takes/:id
Authorization: Bearer TOKEN
```

### Create Stock Take
```http
POST /stock-takes
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "notes": "Monthly stock count"
}
```

### Update Stock Take Item
```http
PUT /stock-takes/items/:id
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "counted_quantity": 8
}
```

### Complete Stock Take
```http
POST /stock-takes/:id/complete
Authorization: Bearer TOKEN
```

## Sync (Offline Support)

### Queue Operation
```http
POST /sync/queue
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "operation": "create",
  "table_name": "sales",
  "data": {...}
}
```

### Get Pending Operations
```http
GET /sync/queue/pending
Authorization: Bearer TOKEN
```

### Mark Operation Complete
```http
PUT /sync/queue/:id/complete
Authorization: Bearer TOKEN
```

### Clear Completed Operations
```http
DELETE /sync/queue/completed
Authorization: Bearer TOKEN
```

### Get Sync Status
```http
GET /sync/status
Authorization: Bearer TOKEN
```

## Error Responses

All endpoints may return these error responses:

**400 Bad Request:**
```json
{
  "error": "Validation error message"
}
```

**401 Unauthorized:**
```json
{
  "error": "Authentication required"
}
```

**404 Not Found:**
```json
{
  "error": "Resource not found"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Something went wrong!"
}
```

## Rate Limiting

Currently no rate limiting is implemented. Consider adding rate limiting for production use.

## CORS

CORS is enabled for all origins in development. Configure appropriately for production.
