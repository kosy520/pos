const express = require('express');
const router = express.Router();
const db = require('../config/database');
const authenticate = require('../middleware/auth');

// Generate stock take reference
function generateStockTakeReference() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ST-${year}${month}${day}-${random}`;
}

// Get all stock takes
router.get('/', authenticate, (req, res) => {
  const { status } = req.query;
  let query = `SELECT st.*, u.username as user_name 
               FROM stock_takes st 
               LEFT JOIN users u ON st.user_id = u.id 
               WHERE 1=1`;
  const params = [];

  if (status) {
    query += ' AND st.status = ?';
    params.push(status);
  }

  query += ' ORDER BY st.started_at DESC';

  db.all(query, params, (err, stockTakes) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(stockTakes);
  });
});

// Get stock take by ID with items
router.get('/:id', authenticate, (req, res) => {
  db.get(
    `SELECT st.*, u.username as user_name 
     FROM stock_takes st 
     LEFT JOIN users u ON st.user_id = u.id 
     WHERE st.id = ?`,
    [req.params.id],
    (err, stockTake) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!stockTake) {
        return res.status(404).json({ error: 'Stock take not found' });
      }

      db.all(
        `SELECT sti.*, p.name as product_name, p.sku 
         FROM stock_take_items sti 
         JOIN products p ON sti.product_id = p.id 
         WHERE sti.stock_take_id = ?`,
        [req.params.id],
        (err, items) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          stockTake.items = items;
          res.json(stockTake);
        }
      );
    }
  );
});

// Create new stock take
router.post('/', authenticate, (req, res) => {
  const { notes } = req.body;
  const reference = generateStockTakeReference();
  
  db.run(
    'INSERT INTO stock_takes (reference, user_id, notes) VALUES (?, ?, ?)',
    [reference, req.user.userId, notes],
    function(err) {
      if (err) {
        return res.status(400).json({ error: err.message });
      }

      const stockTakeId = this.lastID;

      // Get all products and create stock take items
      db.all('SELECT id, quantity FROM products', (err, products) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        const itemPromises = products.map(product => {
          return new Promise((resolve, reject) => {
            db.run(
              'INSERT INTO stock_take_items (stock_take_id, product_id, expected_quantity, counted_quantity, variance) VALUES (?, ?, ?, ?, ?)',
              [stockTakeId, product.id, product.quantity, null, null],
              (err) => {
                if (err) reject(err);
                else resolve();
              }
            );
          });
        });

        Promise.all(itemPromises)
          .then(() => {
            res.status(201).json({
              id: stockTakeId,
              reference: reference,
              message: 'Stock take created successfully'
            });
          })
          .catch(err => {
            res.status(500).json({ error: err.message });
          });
      });
    }
  );
});

// Update stock take item count
router.put('/items/:id', authenticate, (req, res) => {
  const { counted_quantity } = req.body;
  
  if (counted_quantity === undefined || counted_quantity === null) {
    return res.status(400).json({ error: 'Counted quantity is required' });
  }

  // Get the item to calculate variance
  db.get(
    'SELECT * FROM stock_take_items WHERE id = ?',
    [req.params.id],
    (err, item) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!item) {
        return res.status(404).json({ error: 'Stock take item not found' });
      }

      const variance = counted_quantity - item.expected_quantity;

      db.run(
        'UPDATE stock_take_items SET counted_quantity = ?, variance = ? WHERE id = ?',
        [counted_quantity, variance, req.params.id],
        function(err) {
          if (err) {
            return res.status(400).json({ error: err.message });
          }
          res.json({ message: 'Count updated successfully', variance });
        }
      );
    }
  );
});

// Complete stock take and adjust inventory
router.post('/:id/complete', authenticate, (req, res) => {
  const stockTakeId = req.params.id;

  // Check if stock take exists and is in progress
  db.get(
    'SELECT * FROM stock_takes WHERE id = ? AND status = ?',
    [stockTakeId, 'in_progress'],
    (err, stockTake) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!stockTake) {
        return res.status(404).json({ error: 'Stock take not found or already completed' });
      }

      // Get all items with variance
      db.all(
        'SELECT * FROM stock_take_items WHERE stock_take_id = ? AND variance != 0',
        [stockTakeId],
        (err, items) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          // Update product quantities and create stock movements
          const updatePromises = items.map(item => {
            return new Promise((resolve, reject) => {
              db.run(
                'UPDATE products SET quantity = ? WHERE id = ?',
                [item.counted_quantity, item.product_id],
                (err) => {
                  if (err) return reject(err);

                  // Record stock movement
                  db.run(
                    'INSERT INTO stock_movements (product_id, type, quantity, reference, user_id) VALUES (?, ?, ?, ?, ?)',
                    [item.product_id, 'adjustment', item.variance, stockTake.reference, req.user.userId],
                    (err) => {
                      if (err) return reject(err);
                      resolve();
                    }
                  );
                }
              );
            });
          });

          Promise.all(updatePromises)
            .then(() => {
              // Mark stock take as completed
              db.run(
                'UPDATE stock_takes SET status = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?',
                ['completed', stockTakeId],
                function(err) {
                  if (err) {
                    return res.status(500).json({ error: err.message });
                  }
                  res.json({ 
                    message: 'Stock take completed and inventory adjusted',
                    adjusted_items: items.length
                  });
                }
              );
            })
            .catch(err => {
              res.status(500).json({ error: err.message });
            });
        }
      );
    }
  );
});

module.exports = router;
