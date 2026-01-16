const express = require('express');
const router = express.Router();
const db = require('../database');

// Get all companies
router.get('/', (req, res) => {
  db.all('SELECT * FROM companies ORDER BY name ASC', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get single company
router.get('/:id', (req, res) => {
  db.get('SELECT * FROM companies WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Company not found' });
      return;
    }
    res.json(row);
  });
});

// Create company
router.post('/', (req, res) => {
  const { name, contact_person, email, phone, address } = req.body;

  if (!name) {
    res.status(400).json({ error: 'Company name is required' });
    return;
  }

  const sql = `INSERT INTO companies (name, contact_person, email, phone, address) VALUES (?, ?, ?, ?, ?)`;
  db.run(sql, [name, contact_person, email, phone, address], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.status(201).json({ id: this.lastID, name, contact_person, email, phone, address });
  });
});

// Update company
router.put('/:id', (req, res) => {
  const { name, contact_person, email, phone, address } = req.body;
  const sql = `UPDATE companies SET name = ?, contact_person = ?, email = ?, phone = ?, address = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;

  db.run(sql, [name, contact_person, email, phone, address, req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Company not found' });
      return;
    }
    res.json({ id: req.params.id, name, contact_person, email, phone, address });
  });
});

// Delete company
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM companies WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Company not found' });
      return;
    }
    res.json({ message: 'Company deleted successfully' });
  });
});

module.exports = router;
