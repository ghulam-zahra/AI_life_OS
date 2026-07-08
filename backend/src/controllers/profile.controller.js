const { db } = require('../config/firebase');
const { v4: uuidv4 } = require('uuid');

// POST /api/profile — Create user profile
const createProfile = async (req, res) => {
  try {
    const {
      name,
      degree,
      semester,
      university,
      skills,
      interests,
      dreamJob,
      studyTimePerDay,
      language,
      github
    } = req.body;

    // Basic validation
    if (!name || !degree || !university) {
      return res.status(400).json({
        success: false,
        error: 'Name, degree, and university are required'
      });
    }

    const userId = `u_${uuidv4().slice(0, 8)}`;

    const profileData = {
      name,
      degree,
      semester: semester || null,
      university,
      skills: skills || [],
      interests: interests || [],
      dreamJob: dreamJob || '',
      studyTimePerDay: studyTimePerDay || null,
      language: language || 'English',
      github: github || '',
      createdAt: new Date().toISOString()
    };

    await db.collection('users').doc(userId).set(profileData);

    res.json({ userId, success: true });
  } catch (error) {
    console.error('Error creating profile:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/profile/:userId — Get user profile
const getProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    const doc = await db.collection('users').doc(userId).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
    }

    res.json({ success: true, profile: doc.data() });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { createProfile, getProfile };