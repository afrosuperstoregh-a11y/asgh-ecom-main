const express = require('express');
const router = express.Router();

// Mock product routes
router.get('/', (req, res) => {
  res.json({ message: 'Get all products - implement product listing' });
});

router.get('/:id', (req, res) => {
  res.json({ message: `Get product ${req.params.id} - implement product details` });
});

router.post('/', (req, res) => {
  res.json({ message: 'Create product - implement product creation' });
});

router.put('/:id', (req, res) => {
  res.json({ message: `Update product ${req.params.id} - implement product update` });
});

router.delete('/:id', (req, res) => {
  res.json({ message: `Delete product ${req.params.id} - implement product deletion` });
});

module.exports = router;
