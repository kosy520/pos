#!/bin/bash

# Seed script to populate the database with sample data

BASE_URL="http://localhost:3001/api"

echo "=== Seeding POS/ERP System with Sample Data ==="
echo ""

# Wait for server to be ready
sleep 2

# 1. Register admin user
echo "1. Creating admin user..."
curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123",
    "email": "admin@pos.com",
    "role": "admin"
  }' > /dev/null

# 2. Login
echo "2. Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo "   Token obtained"

# 3. Create products
echo "3. Creating sample products..."

curl -s -X POST "$BASE_URL/products" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Laptop Pro 15",
    "description": "High-performance laptop with 16GB RAM",
    "sku": "LAP-001",
    "barcode": "1234567890123",
    "price": 1299.99,
    "cost": 950.00,
    "quantity": 15,
    "min_quantity": 3,
    "category": "Electronics",
    "unit": "piece"
  }' > /dev/null

curl -s -X POST "$BASE_URL/products" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Wireless Mouse",
    "description": "Ergonomic wireless mouse",
    "sku": "MOU-001",
    "barcode": "2345678901234",
    "price": 29.99,
    "cost": 15.00,
    "quantity": 50,
    "min_quantity": 10,
    "category": "Electronics",
    "unit": "piece"
  }' > /dev/null

curl -s -X POST "$BASE_URL/products" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "USB-C Cable",
    "description": "2m USB-C to USB-A cable",
    "sku": "CAB-001",
    "barcode": "3456789012345",
    "price": 12.99,
    "cost": 5.00,
    "quantity": 100,
    "min_quantity": 20,
    "category": "Accessories",
    "unit": "piece"
  }' > /dev/null

curl -s -X POST "$BASE_URL/products" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Mechanical Keyboard",
    "description": "RGB mechanical gaming keyboard",
    "sku": "KEY-001",
    "barcode": "4567890123456",
    "price": 89.99,
    "cost": 45.00,
    "quantity": 25,
    "min_quantity": 5,
    "category": "Electronics",
    "unit": "piece"
  }' > /dev/null

curl -s -X POST "$BASE_URL/products" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Monitor 27 inch",
    "description": "4K IPS display",
    "sku": "MON-001",
    "barcode": "5678901234567",
    "price": 399.99,
    "cost": 250.00,
    "quantity": 8,
    "min_quantity": 2,
    "category": "Electronics",
    "unit": "piece"
  }' > /dev/null

curl -s -X POST "$BASE_URL/products" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Webcam HD",
    "description": "1080p webcam with microphone",
    "sku": "WEB-001",
    "barcode": "6789012345678",
    "price": 59.99,
    "cost": 30.00,
    "quantity": 2,
    "min_quantity": 5,
    "category": "Electronics",
    "unit": "piece"
  }' > /dev/null

echo "   Created 6 products"

# 4. Create customers
echo "4. Creating sample customers..."

curl -s -X POST "$BASE_URL/customers" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "John Smith",
    "email": "john.smith@email.com",
    "phone": "+1-555-0101",
    "address": "123 Main Street, New York, NY 10001",
    "notes": "Regular customer, prefers email invoices"
  }' > /dev/null

curl -s -X POST "$BASE_URL/customers" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Sarah Johnson",
    "email": "sarah.j@company.com",
    "phone": "+1-555-0102",
    "address": "456 Oak Avenue, Los Angeles, CA 90001",
    "notes": "Corporate account - Net 30 payment terms"
  }' > /dev/null

curl -s -X POST "$BASE_URL/customers" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Tech Solutions Inc",
    "email": "orders@techsolutions.com",
    "phone": "+1-555-0103",
    "address": "789 Business Blvd, Chicago, IL 60601",
    "notes": "Bulk buyer, volume discount applicable"
  }' > /dev/null

echo "   Created 3 customers"

# 5. Create sales
echo "5. Creating sample sales..."

curl -s -X POST "$BASE_URL/sales" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "customer_id": 1,
    "items": [
      {"product_id": 1, "quantity": 1, "unit_price": 1299.99},
      {"product_id": 2, "quantity": 2, "unit_price": 29.99}
    ],
    "payment_method": "card",
    "notes": "Express delivery requested"
  }' > /dev/null

curl -s -X POST "$BASE_URL/sales" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "customer_id": 2,
    "items": [
      {"product_id": 4, "quantity": 3, "unit_price": 89.99},
      {"product_id": 3, "quantity": 5, "unit_price": 12.99}
    ],
    "payment_method": "bank_transfer",
    "notes": "Corporate order #12345"
  }' > /dev/null

echo "   Created 2 sales"

# 6. Create invoices
echo "6. Creating sample invoices..."

curl -s -X POST "$BASE_URL/invoices" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "customer_id": 3,
    "type": "purchase",
    "total_amount": 5000.00,
    "tax_amount": 500.00,
    "due_date": "2025-11-18",
    "notes": "Bulk order from supplier",
    "status": "sent"
  }' > /dev/null

curl -s -X POST "$BASE_URL/invoices" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "customer_id": 1,
    "type": "proforma",
    "total_amount": 2500.00,
    "tax_amount": 250.00,
    "due_date": "2025-11-01",
    "notes": "Quote for office equipment",
    "status": "draft"
  }' > /dev/null

curl -s -X POST "$BASE_URL/invoices" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "customer_id": 2,
    "type": "sales",
    "total_amount": 1800.00,
    "tax_amount": 180.00,
    "due_date": "2025-10-28",
    "notes": "Monthly services invoice",
    "status": "sent"
  }' > /dev/null

echo "   Created 3 invoices"

echo ""
echo "=== Sample data seeded successfully! ==="
echo ""
echo "Login credentials:"
echo "  Username: admin"
echo "  Password: admin123"
echo ""
echo "Database now contains:"
echo "  - 6 Products (1 with low stock)"
echo "  - 3 Customers"
echo "  - 2 Sales"
echo "  - 3 Invoices (PO, PI, SI)"
echo ""
