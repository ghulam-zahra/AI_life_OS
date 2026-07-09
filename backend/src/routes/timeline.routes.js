const express = require('express');
const router = express.Router();
const { generateTimeline } = require('../controllers/timeline.controller');

router.post('/', generateTimeline);

module.exports = router;