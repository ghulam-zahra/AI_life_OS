const { db } = require('../config/firebase');
const { callAI } = require('../services/ai.service');

const analyzeReadiness = async (req, res) => {
  try {
    const { userId, targetRole } = req.body;
    if (!userId) return res.status(400).json({ success: false, error: 'userId is required' });

    const cachedDoc = await db.collection('readiness_results').doc(userId).get();
    if (cachedDoc.exists) {
      return res.json(cachedDoc.data());
    }

    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) return res.status(404).json({ success: false, error: 'User not found' });
    const profile = userDoc.data();

    const systemPrompt = `You are a job readiness analyzer AI. Respond ONLY with valid JSON, no explanations, no markdown, matching this exact structure:
{
  "readinessPercent": <number 0-100>,
  "missingSkills": ["skill1", "skill2"],
  "estimatedDaysToReady": <number>
}`;

    const userPrompt = `User skills: ${profile.skills?.join(', ')}, Target role: ${targetRole || profile.dreamJob}. Analyze job readiness.`;

    let readinessData;
    try {
      readinessData = await callAI(systemPrompt, userPrompt);
    } catch (aiError) {
      readinessData = {
        readinessPercent: 60,
        missingSkills: ["Testing", "System Design"],
        estimatedDaysToReady: 60
      };
    }

    await db.collection('readiness_results').doc(userId).set({ ...readinessData, generatedAt: new Date().toISOString() });
    res.json(readinessData);
  } catch (error) {
    console.error('Readiness error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { analyzeReadiness };