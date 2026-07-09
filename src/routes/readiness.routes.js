const express = require('express');
const router = express.Router();
const { analyzeReadiness } = require('../controllers/readiness.controller');

router.post('/', analyzeReadiness);

module.exports = router;