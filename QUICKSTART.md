# Quick Start Guide

## Prerequisites
- Node.js v14+ installed
- npm or yarn package manager

## Installation Steps

### 1. Clone and Install
```bash
git clone https://github.com/kosy520/pos.git
cd pos
npm install
cd client && npm install && cd ..
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env and set a secure JWT_SECRET
```

### 3. Start Backend Server
```bash
npm start
# Server will run on http://localhost:3001
```

### 4. Start Frontend (in a new terminal)
```bash
npm run client
# Frontend will run on http://localhost:3000
```

## First Steps

### 1. Create Admin Account
- Open http://localhost:3000
- Click "Register"
- Create your admin account
- Login with your credentials

### 2. Set Up Products
- Navigate to "Products"
- Click "+ Add Product"
- Add your first product with:
  - Name (required)
  - Price (required)
  - SKU, Barcode (optional but recommended)
  - Initial quantity
  - Minimum quantity (for low stock alerts)

### 3. Add Customers (Optional)
- Navigate to "Customers"
- Add customer details for better CRM

### 4. Make Your First Sale
- Navigate to "Sales"
- Click "+ New Sale"
- Add products to cart by clicking on them
- Adjust quantities as needed
- Select payment method
- Click "Complete Sale"
- QR code will be generated automatically

## Key Features Quick Access

### Dashboard
View summary of:
- Total sales count and revenue
- Inventory value
- Low stock alerts

### Products
- Add/Edit/Delete products
- Search functionality
- Low stock highlighting
- SKU and barcode support

### Sales (POS)
- Shopping cart interface
- Multiple payment methods
- QR code generation
- Customer selection

### Customers (CRM)
- Customer database
- Contact information
- Purchase history

### Invoices
- Create Purchase Orders (PO)
- Create Proforma Invoices (PI)
- Create Sales Invoices (SI)
- QR codes on all invoices
- Status tracking

### Inventory
- View stock movements
- Inventory valuation
- Movement history

### Stock Take
- Create physical count session
- Count each product
- Automatic variance calculation
- One-click inventory adjustment

## Offline Mode

The system works offline using local SQLite database:
- All operations saved locally
- Sync queue tracks offline changes
- Visual indicator shows connection status
- Automatic sync when online

## Testing the API

Run the included test script:
```bash
bash test-api.sh
```

## Troubleshooting

### Server won't start
- Check if port 3001 is available
- Ensure all dependencies are installed: `npm install`

### Frontend won't start
- Check if port 3000 is available
- Ensure client dependencies are installed: `cd client && npm install`

### Database errors
- Delete `server/database.sqlite` and restart
- Database will be recreated automatically

### Authentication issues
- Clear browser localStorage
- Register a new user
- Check JWT_SECRET in .env file

## Production Deployment

### Backend
1. Set NODE_ENV=production in .env
2. Use a process manager like PM2:
   ```bash
   npm install -g pm2
   pm2 start server/index.js --name pos-backend
   ```

### Frontend
1. Build the React app:
   ```bash
   cd client && npm run build
   ```
2. Serve the build folder with a web server

## Support

For issues and questions:
- Check the main README.md
- Review the API documentation
- Open an issue on GitHub

## Next Steps

1. Customize the system for your business
2. Set up regular backups of database.sqlite
3. Configure email notifications (future feature)
4. Add more products and customers
5. Explore reporting features

Happy selling! 🚀
