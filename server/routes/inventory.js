const express = require('express');
const router = express.Router();
const db = require('../config/database');
const authenticate = require('../middleware/auth');

// Get stock movements
router.get('/movements', authenticate, (req, res) => {
  const { product_id, type, startDate, endDate } = req.query;
  let query = `SELECT sm.*, p.name as product_name, p.sku, u.username 
               FROM stock_movements sm 
               JOIN products p ON sm.product_id = p.id 
               LEFT JOIN users u ON sm.user_id = u.id 
               WHERE 1=1`;
  const params = [];

  if (product_id) {
    query += ' AND sm.product_id = ?';
    params.push(product_id);
  }

  if (type) {
    query += ' AND sm.type = ?';
    params.push(type);
  }

  if (startDate) {
    query += ' AND DATE(sm.created_at) >= ?';
    params.push(startDate);
  }

  if (endDate) {
    query += ' AND DATE(sm.created_at) <= ?';
    params.push(endDate);
  }

  query += ' ORDER BY sm.created_at DESC';

  db.all(query, params, (err, movements) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(movements);
  });
});

// Add stock (manual adjustment)
router.post('/adjust', authenticate, (req, res) => {
  const { product_id, quantity, type, reference, notes } = req.body;
  
  if (!product_id || !quantity || !type) {
    return res.status(400).json({ error: 'Product ID, quantity, and type are required' });
  }

  // Update product quantity
  const quantityChange = type === 'addition' ? quantity : -quantity;
  
  db.run(
    'UPDATE products SET quantity = quantity + ? WHERE id = ?',
    [quantityChange, product_id],
    function(err) {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // Record stock movement
      db.run(
        'INSERT INTO stock_movements (product_id, type, quantity, reference, notes, user_id) VALUES (?, ?, ?, ?, ?, ?)',
        [product_id, type, quantityChange, reference, notes, req.user.userId],
        function(err) {
          if (err) {
            return res.status(400).json({ error: err.message });
          }
          res.status(201).json({
            id: this.lastID,
            message: 'Stock adjusted successfully'
          });
        }
      );
    }
  );
});

// Get inventory value
router.get('/value', authenticate, (req, res) => {
  db.get(
    `SELECT 
      SUM(quantity * cost) as total_cost_value,
      SUM(quantity * price) as total_retail_value,
      COUNT(*) as total_products,
      SUM(quantity) as total_units
     FROM products`,
    (err, value) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(value);
    }
  );
});

module.exports = router;
