const express = require('express');
const { categories } = require('../data/categories');

const router = express.Router();

// GET /api/categories
router.get('/', (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: categories,
      count: categories.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    });
  }
});

module.exports = router;
