#!/bin/bash

# Test script for POS/ERP System API endpoints

BASE_URL="http://localhost:3001/api"

echo "=== POS/ERP System API Test ==="
echo ""

# 1. Register a test user
echo "1. Registering test user..."
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123",
    "email": "admin@pos.com",
    "role": "admin"
  }')
echo "Response: $REGISTER_RESPONSE"
echo ""

# 2. Login
echo "2. Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }')
echo "Response: $LOGIN_RESPONSE"

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo "Token obtained: ${TOKEN:0:20}..."
echo ""

# 3. Create a product
echo "3. Creating a product..."
PRODUCT_RESPONSE=$(curl -s -X POST "$BASE_URL/products" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
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
  }')
echo "Response: $PRODUCT_RESPONSE"
echo ""

# 4. Create a customer
echo "4. Creating a customer..."
CUSTOMER_RESPONSE=$(curl -s -X POST "$BASE_URL/customers" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "address": "123 Main St, City"
  }')
echo "Response: $CUSTOMER_RESPONSE"
echo ""

# 5. Get all products
echo "5. Getting all products..."
PRODUCTS=$(curl -s -X GET "$BASE_URL/products" \
  -H "Authorization: Bearer $TOKEN")
echo "Response: $PRODUCTS"
echo ""

# 6. Check health
echo "6. Checking system health..."
HEALTH=$(curl -s -X GET "$BASE_URL/health")
echo "Response: $HEALTH"
echo ""

echo "=== Test completed ==="
