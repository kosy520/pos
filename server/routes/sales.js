const express = require('express');
const router = express.Router();
const db = require('../config/database');
const authenticate = require('../middleware/auth');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

// Generate invoice number
function generateInvoiceNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `INV-${year}${month}${day}-${random}`;
}

// Get all sales
router.get('/', authenticate, (req, res) => {
  const { startDate, endDate, status } = req.query;
  let query = `SELECT s.*, c.name as customer_name 
               FROM sales s 
               LEFT JOIN customers c ON s.customer_id = c.id 
               WHERE 1=1`;
  const params = [];

  if (startDate) {
    query += ' AND DATE(s.created_at) >= ?';
    params.push(startDate);
  }

  if (endDate) {
    query += ' AND DATE(s.created_at) <= ?';
    params.push(endDate);
  }

  if (status) {
    query += ' AND s.status = ?';
    params.push(status);
  }

  query += ' ORDER BY s.created_at DESC';

  db.all(query, params, (err, sales) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(sales);
  });
});

// Get sale by ID with items
router.get('/:id', authenticate, (req, res) => {
  db.get(
    `SELECT s.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone
     FROM sales s 
     LEFT JOIN customers c ON s.customer_id = c.id 
     WHERE s.id = ?`,
    [req.params.id],
    (err, sale) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!sale) {
        return res.status(404).json({ error: 'Sale not found' });
      }

      db.all(
        `SELECT si.*, p.name as product_name, p.sku 
         FROM sale_items si 
         JOIN products p ON si.product_id = p.id 
         WHERE si.sale_id = ?`,
        [req.params.id],
        (err, items) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          sale.items = items;
          res.json(sale);
        }
      );
    }
  );
});

// Create sale
router.post('/', authenticate, async (req, res) => {
  const { customer_id, items, payment_method, notes, discount_amount } = req.body;
  
  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'Sale must have at least one item' });
  }

  const invoiceNumber = generateInvoiceNumber();
  
  try {
    // Calculate totals
    let totalAmount = 0;
    let taxAmount = 0;

    for (const item of items) {
      const subtotal = item.quantity * item.unit_price;
      totalAmount += subtotal;
    }

    // Apply discount
    if (discount_amount) {
      totalAmount -= discount_amount;
    }

    // Generate QR code
    const qrData = JSON.stringify({
      invoice: invoiceNumber,
      amount: totalAmount,
      date: new Date().toISOString()
    });
    const qrCode = await QRCode.toDataURL(qrData);

    // Insert sale
    db.run(
      `INSERT INTO sales (invoice_number, customer_id, total_amount, tax_amount, discount_amount, 
        payment_method, status, notes, qr_code, user_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [invoiceNumber, customer_id, totalAmount, taxAmount, discount_amount || 0, 
       payment_method, 'completed', notes, qrCode, req.user.userId],
      function(err) {
        if (err) {
          return res.status(400).json({ error: err.message });
        }

        const saleId = this.lastID;

        // Insert sale items and update inventory
        const itemPromises = items.map(item => {
          return new Promise((resolve, reject) => {
            const subtotal = item.quantity * item.unit_price;
            
            db.run(
              'INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)',
              [saleId, item.product_id, item.quantity, item.unit_price, subtotal],
              (err) => {
                if (err) return reject(err);

                // Update product quantity
                db.run(
                  'UPDATE products SET quantity = quantity - ? WHERE id = ?',
                  [item.quantity, item.product_id],
                  (err) => {
                    if (err) return reject(err);

                    // Record stock movement
                    db.run(
                      'INSERT INTO stock_movements (product_id, type, quantity, reference, user_id) VALUES (?, ?, ?, ?, ?)',
                      [item.product_id, 'sale', -item.quantity, invoiceNumber, req.user.userId],
                      (err) => {
                        if (err) return reject(err);
                        resolve();
                      }
                    );
                  }
                );
              }
            );
          });
        });

        Promise.all(itemPromises)
          .then(() => {
            res.status(201).json({
              id: saleId,
              invoice_number: invoiceNumber,
              qr_code: qrCode,
              message: 'Sale created successfully'
            });
          })
          .catch(err => {
            res.status(500).json({ error: err.message });
          });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get sales reports
router.get('/reports/summary', authenticate, (req, res) => {
  const { startDate, endDate } = req.query;
  let query = 'SELECT COUNT(*) as total_sales, SUM(total_amount) as total_revenue FROM sales WHERE 1=1';
  const params = [];

  if (startDate) {
    query += ' AND DATE(created_at) >= ?';
    params.push(startDate);
  }

  if (endDate) {
    query += ' AND DATE(created_at) <= ?';
    params.push(endDate);
  }

  db.get(query, params, (err, summary) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(summary);
  });
});

module.exports = router;
