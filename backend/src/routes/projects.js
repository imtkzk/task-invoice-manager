const express = require('express');
const router = express.Router();
const db = require('../database');

// Get all projects
router.get('/', (req, res) => {
  db.all('SELECT * FROM projects ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get single project
router.get('/:id', (req, res) => {
  db.get('SELECT * FROM projects WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    res.json(row);
  });
});

// Create project
router.post('/', (req, res) => {
  const { name, description, client_name, hourly_rate } = req.body;

  if (!name) {
    res.status(400).json({ error: 'Project name is required' });
    return;
  }

  const sql = `INSERT INTO projects (name, description, client_name, hourly_rate) VALUES (?, ?, ?, ?)`;
  db.run(sql, [name, description, client_name, hourly_rate || 0], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.status(201).json({ id: this.lastID, name, description, client_name, hourly_rate });
  });
});

// Update project
router.put('/:id', (req, res) => {
  const { name, description, client_name, hourly_rate } = req.body;
  const sql = `UPDATE projects SET name = ?, description = ?, client_name = ?, hourly_rate = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;

  db.run(sql, [name, description, client_name, hourly_rate, req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    res.json({ id: req.params.id, name, description, client_name, hourly_rate });
  });
});

// Delete project
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM projects WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    res.json({ message: 'Project deleted successfully' });
  });
});

module.exports = router;
