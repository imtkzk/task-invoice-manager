const express = require('express');
const router = express.Router();
const db = require('../database');

// Get all time entries for a task
router.get('/', (req, res) => {
  const { task_id } = req.query;

  if (!task_id) {
    res.status(400).json({ error: 'task_id query parameter is required' });
    return;
  }

  db.all('SELECT * FROM time_entries WHERE task_id = ? ORDER BY created_at DESC', [task_id], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get single time entry
router.get('/:id', (req, res) => {
  db.get('SELECT * FROM time_entries WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Time entry not found' });
      return;
    }
    res.json(row);
  });
});

// Create time entry
router.post('/', (req, res) => {
  const { task_id, duration_minutes, description, started_at, ended_at } = req.body;

  if (!task_id || !duration_minutes) {
    res.status(400).json({ error: 'task_id and duration_minutes are required' });
    return;
  }

  const sql = `INSERT INTO time_entries (task_id, duration_minutes, description, started_at, ended_at) VALUES (?, ?, ?, ?, ?)`;
  db.run(sql, [task_id, duration_minutes, description, started_at, ended_at], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.status(201).json({ id: this.lastID, task_id, duration_minutes, description, started_at, ended_at });
  });
});

// Update time entry
router.put('/:id', (req, res) => {
  const { task_id, duration_minutes, description, started_at, ended_at } = req.body;
  const sql = `UPDATE time_entries SET task_id = ?, duration_minutes = ?, description = ?, started_at = ?, ended_at = ? WHERE id = ?`;

  db.run(sql, [task_id, duration_minutes, description, started_at, ended_at, req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Time entry not found' });
      return;
    }
    res.json({ id: req.params.id, task_id, duration_minutes, description, started_at, ended_at });
  });
});

// Delete time entry
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM time_entries WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Time entry not found' });
      return;
    }
    res.json({ message: 'Time entry deleted successfully' });
  });
});

module.exports = router;
