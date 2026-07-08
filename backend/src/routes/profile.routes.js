const express = require('express');
const router = express.Router();
const { createProfile, getProfile } = require('../controllers/profile.controller');

router.post('/', createProfile);
router.get('/:userId', getProfile);

module.exports = router;