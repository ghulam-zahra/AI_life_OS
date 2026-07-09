const express = require('express');
const router = express.Router();
const { generateRoadmap } = require('../controllers/roadmap.controller');

router.post('/', generateRoadmap);

module.exports = router;