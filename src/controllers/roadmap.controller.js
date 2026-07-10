const { db } = require('../config/firebase');
const { callAI } = require('../services/ai.service');

const generateRoadmap = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ success: false, error: 'userId is required' });

    const cachedDoc = await db.collection('roadmap_results').doc(userId).get();
    if (cachedDoc.exists) {
      return res.json(cachedDoc.data());
    }

    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) return res.status(404).json({ success: false, error: 'User not found' });
    const profile = userDoc.data();

    const systemPrompt = `You are a learning path advisor AI. Respond ONLY with valid JSON, no explanations, no markdown, matching this exact structure:
{
  "daily": [{ "topic": "string", "resources": ["link1", "link2"] }],
  "weekly": [{ "topic": "string", "resources": ["link1"] }],
  "monthly": [{ "topic": "string", "resources": ["link1"] }],
  "sixMonth": [{ "topic": "string", "resources": ["link1"] }]
}
Include 2-3 items per timeframe.`;

    const userPrompt = `User profile: Dream job: ${profile.dreamJob}, Current skills: ${profile.skills?.join(', ')}, Study time per day: ${profile.studyTimePerDay} hours, Interests: ${profile.interests?.join(', ')}. Generate a personalized learning roadmap.`;

    let roadmapData;
    try {
      roadmapData = await callAI(systemPrompt, userPrompt);
    } catch (aiError) {
      roadmapData = {
        daily: [{ topic: "React Basics", resources: ["reactjs.org/docs"] }],
        weekly: [{ topic: "React Hooks", resources: ["reactjs.org/docs/hooks"] }],
        monthly: [{ topic: "Full Project", resources: ["github.com"] }],
        sixMonth: [{ topic: "Job Ready Portfolio", resources: ["linkedin.com"] }]
      };
    }

    await db.collection('roadmap_results').doc(userId).set({
      ...roadmapData,
      generatedAt: new Date().toISOString()
    });

    res.json(roadmapData);
  } catch (error) {
    console.error('Roadmap error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { generateRoadmap };