const express = require('express');
const router = express.Router();
const { generateProjects } = require('../controllers/projects.controller');
router.post('/', generateProjects);
module.exports = router;