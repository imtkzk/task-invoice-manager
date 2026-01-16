const express = require('express');
const router = express.Router();
const db = require('../database');

// Get all tasks (optionally filtered by project)
router.get('/', (req, res) => {
  const { project_id } = req.query;
  let sql = 'SELECT * FROM tasks ORDER BY sort_order ASC, created_at DESC';
  let params = [];

  if (project_id) {
    sql = 'SELECT * FROM tasks WHERE project_id = ? ORDER BY sort_order ASC, created_at DESC';
    params = [project_id];
  }

  db.all(sql, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get single task
router.get('/:id', (req, res) => {
  db.get('SELECT * FROM tasks WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    res.json(row);
  });
});

// Create task
router.post('/', (req, res) => {
  const { project_id, title, description, amount, due_date, status, invoice_status } = req.body;

  if (!title) {
    res.status(400).json({ error: 'Task title is required' });
    return;
  }

  const sql = `INSERT INTO tasks (project_id, title, description, amount, due_date, status, invoice_status) VALUES (?, ?, ?, ?, ?, ?, ?)`;
  db.run(sql, [project_id, title, description, amount || 0, due_date, status || 'pending', invoice_status || 'not_invoiced'], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.status(201).json({
      id: this.lastID,
      project_id,
      title,
      description,
      amount,
      due_date,
      status: status || 'pending',
      invoice_status: invoice_status || 'not_invoiced'
    });
  });
});

// Update task
router.put('/:id', (req, res) => {
  const { project_id, title, description, amount, due_date, status, invoice_status, sort_order } = req.body;
  const sql = `UPDATE tasks SET project_id = ?, title = ?, description = ?, amount = ?, due_date = ?, status = ?, invoice_status = ?, sort_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;

  db.run(sql, [project_id, title, description, amount, due_date, status, invoice_status, sort_order, req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    res.json({ id: req.params.id, project_id, title, description, amount, due_date, status, invoice_status, sort_order });
  });
});

// Delete task
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM tasks WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    res.json({ message: 'Task deleted successfully' });
  });
});

module.exports = router;
