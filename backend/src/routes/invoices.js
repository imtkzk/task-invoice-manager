const express = require('express');
const router = express.Router();
const db = require('../database');
const PDFDocument = require('pdfkit');

// Get all invoices
router.get('/', (req, res) => {
  const { project_id } = req.query;
  let sql = 'SELECT * FROM invoices ORDER BY created_at DESC';
  let params = [];

  if (project_id) {
    sql = 'SELECT * FROM invoices WHERE project_id = ? ORDER BY created_at DESC';
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

// Get single invoice with items
router.get('/:id', (req, res) => {
  db.get('SELECT * FROM invoices WHERE id = ?', [req.params.id], (err, invoice) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!invoice) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }

    db.all('SELECT * FROM invoice_items WHERE invoice_id = ?', [req.params.id], (err, items) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ ...invoice, items });
    });
  });
});

// Create invoice from project tasks
router.post('/', (req, res) => {
  const { project_id, issue_date, due_date, notes, task_ids } = req.body;

  if (!project_id || !issue_date) {
    res.status(400).json({ error: 'project_id and issue_date are required' });
    return;
  }

  // Generate invoice number
  const invoiceNumber = `INV-${Date.now()}`;

  // Get project details
  db.get('SELECT * FROM projects WHERE id = ?', [project_id], (err, project) => {
    if (err || !project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    // Get tasks and time entries to calculate total
    let taskFilter = task_ids && task_ids.length > 0
      ? `AND id IN (${task_ids.join(',')})`
      : '';

    db.all(`SELECT * FROM tasks WHERE project_id = ? ${taskFilter}`, [project_id], (err, tasks) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      let totalAmount = 0;
      let itemsToInsert = [];

      const processTask = (index) => {
        if (index >= tasks.length) {
          // All tasks processed, create invoice
          const sql = `INSERT INTO invoices (project_id, invoice_number, total_amount, issue_date, due_date, notes, status) VALUES (?, ?, ?, ?, ?, ?, 'draft')`;

          db.run(sql, [project_id, invoiceNumber, totalAmount, issue_date, due_date, notes], function(err) {
            if (err) {
              res.status(500).json({ error: err.message });
              return;
            }

            const invoiceId = this.lastID;

            // Insert invoice items
            const insertItem = (itemIndex) => {
              if (itemIndex >= itemsToInsert.length) {
                res.status(201).json({
                  id: invoiceId,
                  invoice_number: invoiceNumber,
                  total_amount: totalAmount,
                  items: itemsToInsert
                });
                return;
              }

              const item = itemsToInsert[itemIndex];
              const itemSql = `INSERT INTO invoice_items (invoice_id, task_id, description, quantity, unit_price, amount) VALUES (?, ?, ?, ?, ?, ?)`;

              db.run(itemSql, [invoiceId, item.task_id, item.description, item.quantity, item.unit_price, item.amount], (err) => {
                if (err) {
                  console.error('Error inserting invoice item:', err);
                }
                insertItem(itemIndex + 1);
              });
            };

            insertItem(0);
          });
          return;
        }

        const task = tasks[index];

        // Get time entries for this task
        db.all('SELECT * FROM time_entries WHERE task_id = ?', [task.id], (err, timeEntries) => {
          let amount = task.amount || 0;

          // If there are time entries and project has hourly rate, calculate from time
          if (timeEntries && timeEntries.length > 0 && project.hourly_rate > 0) {
            const totalMinutes = timeEntries.reduce((sum, entry) => sum + entry.duration_minutes, 0);
            const hours = totalMinutes / 60;
            amount = hours * project.hourly_rate;
          }

          totalAmount += amount;

          itemsToInsert.push({
            task_id: task.id,
            description: task.title,
            quantity: 1,
            unit_price: amount,
            amount: amount
          });

          processTask(index + 1);
        });
      };

      processTask(0);
    });
  });
});

// Generate PDF for invoice
router.get('/:id/pdf', (req, res) => {
  db.get('SELECT * FROM invoices WHERE id = ?', [req.params.id], (err, invoice) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!invoice) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }

    db.get('SELECT * FROM projects WHERE id = ?', [invoice.project_id], (err, project) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      db.all('SELECT * FROM invoice_items WHERE invoice_id = ?', [req.params.id], (err, items) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }

        // Create PDF
        const doc = new PDFDocument({ margin: 50 });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoice_number}.pdf`);

        doc.pipe(res);

        // Header
        doc.fontSize(20).text('請求書 / INVOICE', { align: 'center' });
        doc.moveDown();

        // Invoice details
        doc.fontSize(12);
        doc.text(`請求書番号: ${invoice.invoice_number}`);
        doc.text(`発行日: ${invoice.issue_date}`);
        if (invoice.due_date) {
          doc.text(`支払期限: ${invoice.due_date}`);
        }
        doc.moveDown();

        // Client info
        if (project && project.client_name) {
          doc.text(`請求先: ${project.client_name}`);
          doc.moveDown();
        }

        // Project info
        if (project) {
          doc.text(`プロジェクト: ${project.name}`);
          if (project.description) {
            doc.fontSize(10).text(project.description);
          }
          doc.fontSize(12).moveDown();
        }

        // Items table
        const tableTop = doc.y + 10;
        doc.fontSize(10).font('Helvetica-Bold');

        doc.text('項目', 50, tableTop);
        doc.text('数量', 300, tableTop);
        doc.text('単価', 380, tableTop);
        doc.text('金額', 480, tableTop, { align: 'right' });

        doc.font('Helvetica');
        let yPosition = tableTop + 20;

        items.forEach((item) => {
          doc.text(item.description, 50, yPosition);
          doc.text(item.quantity.toString(), 300, yPosition);
          doc.text(`¥${item.unit_price.toLocaleString()}`, 380, yPosition);
          doc.text(`¥${item.amount.toLocaleString()}`, 480, yPosition, { align: 'right' });
          yPosition += 25;
        });

        // Line
        doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
        yPosition += 10;

        // Total
        doc.font('Helvetica-Bold').fontSize(12);
        doc.text('合計金額:', 380, yPosition);
        doc.text(`¥${invoice.total_amount.toLocaleString()}`, 480, yPosition, { align: 'right' });

        // Notes
        if (invoice.notes) {
          doc.moveDown(2);
          doc.font('Helvetica').fontSize(10);
          doc.text('備考:', { continued: false });
          doc.text(invoice.notes);
        }

        doc.end();
      });
    });
  });
});

// Update invoice status
router.put('/:id', (req, res) => {
  const { status, notes, due_date } = req.body;
  const sql = `UPDATE invoices SET status = ?, notes = ?, due_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;

  db.run(sql, [status, notes, due_date, req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }
    res.json({ id: req.params.id, status, notes, due_date });
  });
});

// Delete invoice
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM invoices WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }
    res.json({ message: 'Invoice deleted successfully' });
  });
});

module.exports = router;
