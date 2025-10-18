const express = require('express');
const router = express.Router();
const db = require('../config/database');
const authenticate = require('../middleware/auth');
const QRCode = require('qrcode');

// Generate invoice number
function generateInvoiceNumber(type) {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const prefix = type === 'purchase' ? 'PO' : type === 'proforma' ? 'PI' : 'SI';
  return `${prefix}-${year}${month}${day}-${random}`;
}

// Get all invoices
router.get('/', authenticate, (req, res) => {
  const { type, status } = req.query;
  let query = `SELECT i.*, c.name as customer_name 
               FROM invoices i 
               LEFT JOIN customers c ON i.customer_id = c.id 
               WHERE 1=1`;
  const params = [];

  if (type) {
    query += ' AND i.type = ?';
    params.push(type);
  }

  if (status) {
    query += ' AND i.status = ?';
    params.push(status);
  }

  query += ' ORDER BY i.created_at DESC';

  db.all(query, params, (err, invoices) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(invoices);
  });
});

// Get invoice by ID
router.get('/:id', authenticate, (req, res) => {
  db.get(
    `SELECT i.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone, c.address as customer_address
     FROM invoices i 
     LEFT JOIN customers c ON i.customer_id = c.id 
     WHERE i.id = ?`,
    [req.params.id],
    (err, invoice) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found' });
      }
      res.json(invoice);
    }
  );
});

// Create invoice (Three-way: Purchase Order, Proforma Invoice, Sales Invoice)
router.post('/', authenticate, async (req, res) => {
  const { customer_id, type, total_amount, tax_amount, due_date, notes, status } = req.body;
  
  if (!type || !total_amount) {
    return res.status(400).json({ error: 'Type and total amount are required' });
  }

  if (!['purchase', 'proforma', 'sales'].includes(type)) {
    return res.status(400).json({ error: 'Invalid invoice type. Must be: purchase, proforma, or sales' });
  }

  const invoiceNumber = generateInvoiceNumber(type);
  
  try {
    // Generate QR code
    const qrData = JSON.stringify({
      invoice: invoiceNumber,
      type: type,
      amount: total_amount,
      date: new Date().toISOString()
    });
    const qrCode = await QRCode.toDataURL(qrData);

    db.run(
      `INSERT INTO invoices (invoice_number, customer_id, type, total_amount, tax_amount, status, due_date, notes, qr_code) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [invoiceNumber, customer_id, type, total_amount, tax_amount || 0, status || 'draft', due_date, notes, qrCode],
      function(err) {
        if (err) {
          return res.status(400).json({ error: err.message });
        }
        res.status(201).json({
          id: this.lastID,
          invoice_number: invoiceNumber,
          qr_code: qrCode,
          message: 'Invoice created successfully'
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update invoice
router.put('/:id', authenticate, (req, res) => {
  const { status, due_date, notes, total_amount, tax_amount } = req.body;
  
  db.run(
    `UPDATE invoices SET 
      status = COALESCE(?, status),
      due_date = COALESCE(?, due_date),
      notes = COALESCE(?, notes),
      total_amount = COALESCE(?, total_amount),
      tax_amount = COALESCE(?, tax_amount)
     WHERE id = ?`,
    [status, due_date, notes, total_amount, tax_amount, req.params.id],
    function(err) {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Invoice not found' });
      }
      res.json({ message: 'Invoice updated successfully' });
    }
  );
});

// Delete invoice
router.delete('/:id', authenticate, (req, res) => {
  db.run('DELETE FROM invoices WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    res.json({ message: 'Invoice deleted successfully' });
  });
});

module.exports = router;
