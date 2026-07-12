const { db } = require('../config/firebase');
const { callAI } = require('../services/ai.service');

const generateResume = async (req, res) => {
  try {
    const { userId, existingResumeText, requestMode } = req.body;
    if (!userId) return res.status(400).json({ success: false, error: 'userId is required' });

    const isImproveMode = requestMode === 'improve';

    // Only use cache for fresh generation, not for improve requests
    if (!isImproveMode) {
      const cachedDoc = await db.collection('resume_results').doc(userId).get();
      if (cachedDoc.exists) {
        return res.json(cachedDoc.data());
      }
    }

    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) return res.status(404).json({ success: false, error: 'User not found' });
    const profile = userDoc.data();

    const systemPrompt = `You are a resume writer AI. Respond ONLY with valid JSON, no explanations, no markdown, matching this exact structure:
{
  "resumeText": "string",
  "linkedinSummary": "string",
  "coverLetter": "string"
}`;

    let userPrompt;
    if (isImproveMode && existingResumeText) {
      userPrompt = `Here is the user's existing resume text:\n"""${existingResumeText}"""\n\nImprove this resume — make the language more professional, fix any weak phrasing, and better highlight achievements. Do NOT rewrite it from scratch or lose key facts already present. User context: Name: ${profile.name}, Degree: ${profile.degree}, University: ${profile.university}, Skills: ${profile.skills?.join(', ')}, Dream job: ${profile.dreamJob}, GitHub: ${profile.github}. Also generate a matching LinkedIn summary and cover letter.`;
    } else {
      userPrompt = `Name: ${profile.name}, Degree: ${profile.degree}, University: ${profile.university}, Skills: ${profile.skills?.join(', ')}, Dream job: ${profile.dreamJob}, GitHub: ${profile.github}. Generate a professional resume, LinkedIn summary, and cover letter.`;
    }

    let resumeData;
    try {
      resumeData = await callAI(systemPrompt, userPrompt);
    } catch (aiError) {
      resumeData = {
        resumeText: existingResumeText || `${profile.name} - ${profile.degree} graduate seeking ${profile.dreamJob} role.`,
        linkedinSummary: `Aspiring ${profile.dreamJob} with skills in ${profile.skills?.join(', ')}.`,
        coverLetter: `Dear Hiring Manager, I am excited to apply for the ${profile.dreamJob} position...`
      };
    }

    await db.collection('resume_results').doc(userId).set({ ...resumeData, generatedAt: new Date().toISOString() });
    res.json(resumeData);
  } catch (error) {
    console.error('Resume error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { generateResume };