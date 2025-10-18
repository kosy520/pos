const express = require('express');
const router = express.Router();
const db = require('../config/database');
const authenticate = require('../middleware/auth');

// Get all products
router.get('/', authenticate, (req, res) => {
  const { category, search } = req.query;
  let query = 'SELECT * FROM products WHERE 1=1';
  const params = [];

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  if (search) {
    query += ' AND (name LIKE ? OR sku LIKE ? OR barcode LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY name';

  db.all(query, params, (err, products) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(products);
  });
});

// Get product by ID
router.get('/:id', authenticate, (req, res) => {
  db.get('SELECT * FROM products WHERE id = ?', [req.params.id], (err, product) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  });
});

// Create product
router.post('/', authenticate, (req, res) => {
  const { name, description, sku, barcode, price, cost, quantity, min_quantity, category, unit } = req.body;
  
  if (!name || price === undefined) {
    return res.status(400).json({ error: 'Name and price are required' });
  }

  db.run(
    `INSERT INTO products (name, description, sku, barcode, price, cost, quantity, min_quantity, category, unit) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, description, sku, barcode, price, cost, quantity || 0, min_quantity || 0, category, unit || 'piece'],
    function(err) {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      res.status(201).json({
        id: this.lastID,
        message: 'Product created successfully'
      });
    }
  );
});

// Update product
router.put('/:id', authenticate, (req, res) => {
  const { name, description, sku, barcode, price, cost, quantity, min_quantity, category, unit } = req.body;
  
  db.run(
    `UPDATE products SET 
      name = COALESCE(?, name),
      description = COALESCE(?, description),
      sku = COALESCE(?, sku),
      barcode = COALESCE(?, barcode),
      price = COALESCE(?, price),
      cost = COALESCE(?, cost),
      quantity = COALESCE(?, quantity),
      min_quantity = COALESCE(?, min_quantity),
      category = COALESCE(?, category),
      unit = COALESCE(?, unit),
      updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [name, description, sku, barcode, price, cost, quantity, min_quantity, category, unit, req.params.id],
    function(err) {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }
      res.json({ message: 'Product updated successfully' });
    }
  );
});

// Delete product
router.delete('/:id', authenticate, (req, res) => {
  db.run('DELETE FROM products WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  });
});

// Get low stock products
router.get('/reports/low-stock', authenticate, (req, res) => {
  db.all(
    'SELECT * FROM products WHERE quantity <= min_quantity ORDER BY quantity',
    (err, products) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(products);
    }
  );
});

module.exports = router;
