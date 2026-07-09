const { db } = require('../config/firebase');
const { callAI } = require('../services/ai.service');

const generateTimeline = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId is required' });
    }

    // Get user profile for personalization
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    const profile = userDoc.data();

    const systemPrompt = `You are a career advisor AI. Respond ONLY with valid JSON, no explanations, no markdown formatting, matching this exact structure:
{
  "scenarios": [
    {
      "name": "Scenario A: <career path>",
      "timelineMonths": <number>,
      "skillsToLearn": ["skill1", "skill2"],
      "salaryRange": "PKR X-Y",
      "companies": ["Company1", "Company2"],
      "interviewDifficulty": "Easy|Medium|Hard",
      "riskLevel": "Low|Medium|High"
    }
  ]
}
Generate exactly 3 scenarios based on the user's interests and dream job.`;

    const userPrompt = `User profile: Dream job: ${profile.dreamJob}, Current skills: ${profile.skills?.join(', ')}, Interests: ${profile.interests?.join(', ')}, Degree: ${profile.degree}. Generate 3 realistic career scenarios in Pakistan job market.`;

    let timelineData;
    try {
      timelineData = await callAI(systemPrompt, userPrompt);
    } catch (aiError) {
      // Fallback static data if AI fails
      timelineData = {
        scenarios: [
          {
            name: "Scenario A: Frontend Developer",
            timelineMonths: 6,
            skillsToLearn: ["React", "Node.js", "Portfolio Projects"],
            salaryRange: "PKR 80k-150k",
            companies: ["Local Startups", "Software Houses"],
            interviewDifficulty: "Medium",
            riskLevel: "Low"
          }
        ]
      };
    }

    // Cache result in Firestore
    await db.collection('timeline_results').doc(userId).set({
      ...timelineData,
      generatedAt: new Date().toISOString()
    });

    res.json(timelineData);
  } catch (error) {
    console.error('Timeline error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { generateTimeline };