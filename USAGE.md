# Usage Examples

This guide provides practical examples of using the POS/ERP system for common business scenarios.

## Getting Started

### Initial Setup

```bash
# Install dependencies
npm install
cd client && npm install && cd ..

# Start backend
npm start

# Start frontend (new terminal)
npm run client
```

### Create Your First Admin Account

1. Open http://localhost:3000
2. Click "Register"
3. Fill in:
   - Username: `admin`
   - Password: `admin123`
   - Email: `admin@yourcompany.com`
4. Click "Register"
5. Click "Back to Login" and login

## Common Workflows

### Scenario 1: Adding New Products

**Use Case:** You just received inventory from a supplier.

1. Navigate to **Products**
2. Click **+ Add Product**
3. Fill in the details:
   ```
   Name: Laptop Pro 15
   SKU: LAP-001
   Barcode: 1234567890123
   Price: $1299.99
   Cost: $950.00
   Quantity: 15
   Min Quantity: 3
   Category: Electronics
   Unit: piece
   ```
4. Click **Add Product**

**Result:** Product is now in your inventory and available for sale.

---

### Scenario 2: Making a Sale (Walk-in Customer)

**Use Case:** A customer walks in and wants to buy items.

1. Navigate to **Sales**
2. Click **+ New Sale**
3. In the Products panel, click on items to add to cart:
   - Click "Laptop Pro 15" → Added to cart
   - Click "Wireless Mouse" twice → 2 units added
4. In Cart panel:
   - Verify quantities and totals
   - Select Payment Method: `Cash`
5. Click **Complete Sale**
6. QR code is generated
7. Customer receives invoice with QR code

**Result:** 
- Sale recorded
- Inventory automatically reduced
- Invoice with QR code generated
- Stock movements logged

---

### Scenario 3: Making a Sale (Registered Customer)

**Use Case:** A regular customer makes a purchase.

1. First, add the customer (if not already added):
   - Navigate to **Customers**
   - Click **+ Add Customer**
   - Fill in: Name, Email, Phone, Address
   
2. Make the sale:
   - Navigate to **Sales**
   - Click **+ New Sale**
   - Select customer from dropdown
   - Add products to cart
   - Select payment method
   - Add notes if needed
   - Click **Complete Sale**

**Result:**
- Sale linked to customer
- Purchase history updated
- Customer can be tracked for loyalty programs

---

### Scenario 4: Creating a Purchase Order

**Use Case:** You need to order products from a supplier.

1. Navigate to **Invoices**
2. Click **+ Create Invoice**
3. Fill in:
   ```
   Invoice Type: Purchase Order (PO)
   Customer: [Select supplier or leave blank]
   Total Amount: $5000.00
   Tax Amount: $500.00
   Due Date: [Select date]
   Status: Draft
   Notes: Bulk order for Q4 inventory
   ```
4. Click **Create Invoice**

**Result:**
- Purchase Order created with unique PO number
- QR code generated
- Can be sent to supplier
- Track status (draft → sent → received)

---

### Scenario 5: Creating a Proforma Invoice (Quote)

**Use Case:** Customer requests a quote before placing order.

1. Navigate to **Invoices**
2. Click **+ Create Invoice**
3. Fill in:
   ```
   Invoice Type: Proforma Invoice (PI)
   Customer: [Select customer]
   Total Amount: $2500.00
   Tax Amount: $250.00
   Due Date: [Quote valid until]
   Status: Draft
   Notes: Quote for office equipment setup
   ```
4. Click **Create Invoice**

**Result:**
- Proforma invoice created
- Can be sent to customer for approval
- Convert to sales invoice later if accepted

---

### Scenario 6: Physical Stock Count

**Use Case:** Monthly inventory audit.

1. Navigate to **Stock Take**
2. Click **+ New Stock Take**
3. System creates a session with all products
4. Click **Count Stock** on the new entry
5. For each product:
   - Physical count: Count actual items on shelf
   - Enter counted quantity
   - Click **Update**
6. Review variances (red = shortage, green = overage)
7. Click **Complete Stock Take**

**Result:**
- Inventory adjusted to match physical count
- Variances recorded
- Stock movements logged
- Discrepancies identified for investigation

---

### Scenario 7: Checking Low Stock

**Use Case:** Identify products that need reordering.

1. Navigate to **Dashboard**
2. Check "Low Stock Alert" section
3. Products below minimum quantity are listed in red
4. Click through to **Products** to see details

**Alternative:**
- Navigate to **Products**
- Products with low stock are highlighted in red

**Action:**
- Create Purchase Order for low stock items
- Adjust minimum quantities if needed

---

### Scenario 8: Viewing Inventory Value

**Use Case:** Know the total value of your inventory.

1. Navigate to **Inventory**
2. View dashboard cards:
   - **Total Cost Value**: What you paid for inventory
   - **Total Retail Value**: What you can sell it for
   - **Total Units**: Number of items in stock

**Use for:**
- Financial reporting
- Insurance purposes
- Business valuation
- Margin analysis

---

### Scenario 9: Tracking Customer History

**Use Case:** View a customer's purchase history.

1. Navigate to **Customers**
2. Find the customer in the list
3. Note their purchase patterns
4. Use for:
   - Loyalty programs
   - Personalized marketing
   - Credit decisions
   - Customer service

---

### Scenario 10: Viewing Stock Movements

**Use Case:** Audit trail of all inventory changes.

1. Navigate to **Inventory**
2. Scroll to "Stock Movements" table
3. View:
   - Product name and SKU
   - Movement type (sale, addition, adjustment)
   - Quantity change (+/-)
   - Reference (invoice number, etc.)
   - User who made the change
   - Date and time

**Use for:**
- Audit compliance
- Theft detection
- Process improvement
- Reconciliation

---

## Advanced Scenarios

### Multi-Item Sales with Discount

```
1. Add multiple items to cart
2. Note the total
3. In "Notes" field, mention discount reason
4. Calculate discount manually: e.g., 10% off
5. Complete sale
```

**Note:** Currently discount is applied to total, not line items.

---

### Managing Different Units

Products can be sold in different units:

```
- Laptop: piece
- Coffee beans: kg
- Milk: liter
- Cables: box (of 10)
```

When creating products, select the appropriate unit.

---

### Handling Returns

**Current Process:**
1. Navigate to **Inventory**
2. Click manual adjustment
3. Add quantity back with reference to original sale
4. Add note: "Return - Invoice #INV-..."

**Future:** Dedicated returns module planned.

---

### Offline Usage

**Scenario:** Internet goes down during business hours.

1. System continues to work with local database
2. Visual indicator shows "🔴 Offline"
3. Continue making sales as normal
4. All operations saved locally
5. When internet returns:
   - Indicator changes to "🟢 Online"
   - Sync queue processes pending operations
   - All data synchronized

---

### End of Day Reconciliation

**Daily Checklist:**

1. **Sales Summary:**
   - Navigate to Dashboard
   - Note total sales and revenue
   
2. **Cash Count:**
   - Count physical cash
   - Match with cash sales in system
   
3. **Inventory Check:**
   - Verify no negative stock
   - Note any discrepancies
   
4. **Low Stock:**
   - Review low stock alerts
   - Create purchase orders if needed
   
5. **Backup:**
   - Run backup script (see Deployment guide)
   - Store backup securely

---

## Tips and Best Practices

### Product Management
- Always use SKUs for better tracking
- Set realistic minimum quantities for alerts
- Use consistent category names
- Update costs when prices change

### Sales
- Select customer when known for better CRM
- Add notes for special requests
- Verify quantities before completing sale
- Keep payment method accurate for accounting

### Inventory
- Perform stock takes regularly (monthly recommended)
- Investigate large variances immediately
- Keep minimum quantities updated based on sales patterns
- Use categories to organize products

### Invoices
- Use Purchase Orders for all supplier orders
- Send Proforma Invoices before large orders
- Track due dates to manage cash flow
- Update status promptly (draft → sent → paid)

### Security
- Change default admin password immediately
- Create separate user accounts for staff
- Logout when leaving workstation
- Backup database regularly

---

## Troubleshooting Common Issues

### "Product not found" when making sale
- Ensure product exists in Products list
- Check product ID is correct
- Verify product hasn't been deleted

### "Insufficient stock" error
- Check current quantity in Products
- May need to receive new inventory first
- Verify stock take hasn't reduced quantity

### Cannot complete stock take
- Ensure all items have counted quantities
- Check for network issues if online
- Verify you have permission (logged in)

### QR code not displaying
- Check internet connection
- Verify QR code library is installed
- Try refreshing the page

---

## Sample Data for Testing

Use the included seed script:

```bash
bash seed-data.sh
```

This creates:
- 6 sample products
- 3 sample customers
- 2 sample sales
- 3 sample invoices (PO, PI, SI)

Login with:
- Username: `admin`
- Password: `admin123`

---

## Integration Examples

### Exporting Data

**Current:** Use API endpoints to fetch data

```bash
# Get all sales
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/sales

# Get sales summary
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/sales/reports/summary
```

**Future:** CSV/Excel export planned.

---

### Barcode Scanning

**Current:** Manual barcode entry in product form

**Future:** USB barcode scanner support planned.

---

## Business Workflows

### Retail Store
1. Add products
2. Set minimum stock levels
3. Make sales throughout the day
4. End of day: Check dashboard
5. Weekly: Stock take
6. Monthly: Inventory valuation

### Wholesale Business
1. Add customers (companies)
2. Create products in bulk
3. Use Purchase Orders for supplier orders
4. Use Proforma Invoices for customer quotes
5. Convert to Sales Invoices on confirmation
6. Track customer purchase history

### Service Business
1. Add services as "products"
2. Price per hour/project
3. Use customers for client database
4. Sales invoices for billing
5. Track time via notes
6. Monthly reconciliation

---

Need more help? Check the other documentation files:
- README.md - Overview
- QUICKSTART.md - Installation
- API.md - API Reference
- DEPLOYMENT.md - Production setup
- FEATURES.md - Feature details
