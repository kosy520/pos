const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const db = require('./config/database');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const salesRoutes = require('./routes/sales');
const customerRoutes = require('./routes/customers');
const inventoryRoutes = require('./routes/inventory');
const invoiceRoutes = require('./routes/invoices');
const stockTakeRoutes = require('./routes/stockTake');
const syncRoutes = require('./routes/sync');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/stock-takes', stockTakeRoutes);
app.use('/api/sync', syncRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'POS/ERP System is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
