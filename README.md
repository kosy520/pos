# POS/ERP System

A comprehensive Point of Sale and Enterprise Resource Planning system with advanced features for modern businesses.

## Features

### 🛒 Sales Management
- Complete POS interface for quick sales processing
- Shopping cart functionality
- Multiple payment methods (Cash, Card, Mobile Payment, Bank Transfer)
- Real-time inventory updates on sales
- QR code generation for every invoice
- Sales reports and analytics

### 📦 Inventory Management
- Product catalog with SKU and barcode support
- Real-time stock tracking
- Low stock alerts
- Stock movements history
- Inventory valuation (cost and retail value)
- Multiple units support (piece, kg, liter, etc.)

### 👥 Customer Relationship Management (CRM)
- Customer database with contact information
- Purchase history tracking
- Customer notes and details
- Search and filter capabilities

### 📄 Three-Way Invoicing
- **Purchase Orders (PO)** - For procurement tracking
- **Proforma Invoices (PI)** - For quotations
- **Sales Invoices (SI)** - For final billing
- QR code on all invoices
- Invoice status tracking (draft, sent, paid, cancelled)
- Due date management

### 📊 Physical Stock Taking
- Create stock take sessions
- Count physical inventory
- Automatic variance calculation
- Inventory adjustment on completion
- Audit trail for all adjustments

### 🌐 Offline/Online Capability
- Works offline with local SQLite database
- Sync queue for offline operations
- Visual online/offline indicator
- Automatic sync when connection restored

### 🔐 Security
- User authentication with JWT tokens
- Role-based access control
- Secure password hashing with bcrypt

### 📱 QR Code Generation
- Automatic QR code generation for invoices
- QR codes for sales receipts
- Easy mobile scanning for verification

## Technology Stack

### Backend
- **Node.js** with Express.js
- **SQLite** for database (offline support)
- **JWT** for authentication
- **bcryptjs** for password hashing
- **QRCode** library for QR generation

### Frontend
- **React** 18
- **React Router** for navigation
- **Axios** for API calls
- Responsive CSS design

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/kosy520/pos.git
   cd pos
   ```

2. **Install backend dependencies**
   ```bash
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env and set your JWT_SECRET
   ```

5. **Start the backend server**
   ```bash
   npm start
   # Server runs on http://localhost:3001
   ```

6. **Start the frontend (in a new terminal)**
   ```bash
   npm run client
   # Frontend runs on http://localhost:3000
   ```

## Usage

### First Time Setup

1. **Register a user account**
   - Navigate to http://localhost:3000
   - Click "Register" and create your admin account

2. **Login**
   - Use your credentials to login

3. **Add Products**
   - Go to Products section
   - Click "+ Add Product"
   - Fill in product details (name, price, quantity, etc.)

4. **Add Customers (Optional)**
   - Go to Customers section
   - Add customer information for CRM

5. **Make a Sale**
   - Go to Sales section
   - Click "+ New Sale"
   - Add products to cart
   - Select payment method
   - Complete sale to generate QR code

### Key Features Usage

#### Creating a Purchase Order
1. Navigate to Invoices
2. Click "+ Create Invoice"
3. Select "Purchase Order (PO)" as type
4. Fill in details and submit

#### Physical Stock Take
1. Navigate to Stock Take
2. Click "+ New Stock Take"
3. Click "Count Stock" on the new entry
4. Enter counted quantities for each product
5. Click "Complete Stock Take" to adjust inventory

#### Inventory Adjustments
- Stock is automatically adjusted on:
  - Sales transactions
  - Completed stock takes
  - Manual adjustments via Inventory module

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Products
- `GET /api/products` - Get all products
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `GET /api/products/reports/low-stock` - Get low stock products

### Sales
- `GET /api/sales` - Get all sales
- `POST /api/sales` - Create sale
- `GET /api/sales/:id` - Get sale details
- `GET /api/sales/reports/summary` - Get sales summary

### Customers
- `GET /api/customers` - Get all customers
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer
- `GET /api/customers/:id/purchases` - Get customer purchases

### Invoices
- `GET /api/invoices` - Get all invoices
- `POST /api/invoices` - Create invoice
- `PUT /api/invoices/:id` - Update invoice
- `DELETE /api/invoices/:id` - Delete invoice

### Stock Takes
- `GET /api/stock-takes` - Get all stock takes
- `POST /api/stock-takes` - Create stock take
- `GET /api/stock-takes/:id` - Get stock take details
- `PUT /api/stock-takes/items/:id` - Update item count
- `POST /api/stock-takes/:id/complete` - Complete stock take

### Inventory
- `GET /api/inventory/movements` - Get stock movements
- `POST /api/inventory/adjust` - Adjust stock
- `GET /api/inventory/value` - Get inventory value

### Sync (Offline Support)
- `POST /api/sync/queue` - Queue operation for sync
- `GET /api/sync/queue/pending` - Get pending operations
- `PUT /api/sync/queue/:id/complete` - Mark operation complete
- `GET /api/sync/status` - Get sync status

## Database Schema

The system uses SQLite with the following main tables:
- **users** - User authentication and roles
- **customers** - Customer information (CRM)
- **products** - Product catalog
- **sales** - Sales transactions
- **sale_items** - Individual sale items
- **invoices** - Three-way invoicing (PO, PI, SI)
- **stock_movements** - Inventory movement history
- **stock_takes** - Physical stock count sessions
- **stock_take_items** - Individual count items
- **sync_queue** - Offline sync operations

## Development

### Running Tests
```bash
npm test
```

### Linting
```bash
npm run lint
```

### Building for Production
```bash
npm run build
```

## Project Structure

```
pos/
├── server/
│   ├── config/
│   │   └── database.js       # SQLite database setup
│   ├── routes/
│   │   ├── auth.js           # Authentication routes
│   │   ├── products.js       # Product management
│   │   ├── sales.js          # Sales transactions
│   │   ├── customers.js      # CRM routes
│   │   ├── invoices.js       # Three-way invoicing
│   │   ├── inventory.js      # Stock management
│   │   ├── stockTake.js      # Physical stock taking
│   │   └── sync.js           # Offline sync
│   ├── middleware/
│   │   └── auth.js           # JWT authentication
│   └── index.js              # Express server
├── client/
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── components/       # React components
│       ├── pages/
│       │   ├── Login.js
│       │   ├── Dashboard.js
│       │   ├── Products.js
│       │   ├── Sales.js
│       │   ├── Customers.js
│       │   ├── Invoices.js
│       │   ├── Inventory.js
│       │   └── StockTake.js
│       ├── services/
│       │   └── api.js        # API client
│       ├── styles/
│       │   └── index.css     # Global styles
│       ├── App.js
│       └── index.js
├── package.json
├── .env
└── README.md
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

ISC License

## Support

For issues and questions, please open an issue on GitHub.

## Roadmap

Future enhancements planned:
- [ ] Barcode scanner integration
- [ ] Multi-location support
- [ ] Advanced reporting and analytics
- [ ] Email notifications
- [ ] Export to PDF/Excel
- [ ] Mobile app
- [ ] Cloud backup
- [ ] Multi-currency support
- [ ] Supplier management
- [ ] Payroll integration

## Author

POS/ERP System - Built for modern businesses