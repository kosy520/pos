const express = require('express');
const router = express.Router();
const db = require('../config/database');
const authenticate = require('../middleware/auth');

// Get all customers
router.get('/', authenticate, (req, res) => {
  const { search } = req.query;
  let query = 'SELECT * FROM customers WHERE 1=1';
  const params = [];

  if (search) {
    query += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY name';

  db.all(query, params, (err, customers) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(customers);
  });
});

// Get customer by ID
router.get('/:id', authenticate, (req, res) => {
  db.get('SELECT * FROM customers WHERE id = ?', [req.params.id], (err, customer) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json(customer);
  });
});

// Create customer
router.post('/', authenticate, (req, res) => {
  const { name, email, phone, address, notes } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  db.run(
    'INSERT INTO customers (name, email, phone, address, notes) VALUES (?, ?, ?, ?, ?)',
    [name, email, phone, address, notes],
    function(err) {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      res.status(201).json({
        id: this.lastID,
        message: 'Customer created successfully'
      });
    }
  );
});

// Update customer
router.put('/:id', authenticate, (req, res) => {
  const { name, email, phone, address, notes } = req.body;
  
  db.run(
    `UPDATE customers SET 
      name = COALESCE(?, name),
      email = COALESCE(?, email),
      phone = COALESCE(?, phone),
      address = COALESCE(?, address),
      notes = COALESCE(?, notes),
      updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [name, email, phone, address, notes, req.params.id],
    function(err) {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Customer not found' });
      }
      res.json({ message: 'Customer updated successfully' });
    }
  );
});

// Delete customer
router.delete('/:id', authenticate, (req, res) => {
  db.run('DELETE FROM customers WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json({ message: 'Customer deleted successfully' });
  });
});

// Get customer purchase history
router.get('/:id/purchases', authenticate, (req, res) => {
  db.all(
    `SELECT s.*, 
      (SELECT COUNT(*) FROM sale_items WHERE sale_id = s.id) as item_count
     FROM sales s 
     WHERE s.customer_id = ? 
     ORDER BY s.created_at DESC`,
    [req.params.id],
    (err, sales) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(sales);
    }
  );
});

module.exports = router;
