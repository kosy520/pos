const express = require('express');
const router = express.Router();
const db = require('../config/database');
const authenticate = require('../middleware/auth');

// Add operation to sync queue (for offline support)
router.post('/queue', authenticate, (req, res) => {
  const { operation, table_name, data } = req.body;
  
  if (!operation || !table_name || !data) {
    return res.status(400).json({ error: 'Operation, table name, and data are required' });
  }

  db.run(
    'INSERT INTO sync_queue (operation, table_name, data) VALUES (?, ?, ?)',
    [operation, table_name, JSON.stringify(data)],
    function(err) {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      res.status(201).json({
        id: this.lastID,
        message: 'Operation queued for sync'
      });
    }
  );
});

// Get pending sync operations
router.get('/queue/pending', authenticate, (req, res) => {
  db.all(
    'SELECT * FROM sync_queue WHERE status = ? ORDER BY created_at',
    ['pending'],
    (err, operations) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(operations.map(op => ({
        ...op,
        data: JSON.parse(op.data)
      })));
    }
  );
});

// Mark sync operation as completed
router.put('/queue/:id/complete', authenticate, (req, res) => {
  db.run(
    'UPDATE sync_queue SET status = ? WHERE id = ?',
    ['completed', req.params.id],
    function(err) {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Sync operation not found' });
      }
      res.json({ message: 'Sync operation marked as completed' });
    }
  );
});

// Clear completed sync operations
router.delete('/queue/completed', authenticate, (req, res) => {
  db.run(
    'DELETE FROM sync_queue WHERE status = ?',
    ['completed'],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ 
        message: 'Completed sync operations cleared',
        deleted: this.changes
      });
    }
  );
});

// Check sync status
router.get('/status', authenticate, (req, res) => {
  db.all(
    'SELECT status, COUNT(*) as count FROM sync_queue GROUP BY status',
    (err, results) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      const status = {
        pending: 0,
        completed: 0,
        failed: 0
      };

      results.forEach(r => {
        status[r.status] = r.count;
      });

      res.json(status);
    }
  );
});

module.exports = router;
