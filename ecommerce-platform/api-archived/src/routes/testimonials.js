const express = require('express');
const { testimonials } = require('../data/testimonials');

const router = express.Router();

// GET /api/testimonials
router.get('/', (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: testimonials,
      count: testimonials.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching testimonials',
      error: error.message
    });
  }
});

module.exports = router;
