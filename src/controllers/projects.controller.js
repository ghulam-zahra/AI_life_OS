const { db } = require('../config/firebase');
const { callAI } = require('../services/ai.service');

const generateProjects = async (req, res) => {
  try {
    const { userId, level } = req.body;
    if (!userId) return res.status(400).json({ success: false, error: 'userId is required' });

    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) return res.status(404).json({ success: false, error: 'User not found' });
    const profile = userDoc.data();

    const systemPrompt = `You are a project idea generator AI. Respond ONLY with valid JSON, no explanations, no markdown, matching this exact structure:
{
  "projects": [
    {
      "title": "string",
      "description": "string",
      "techStack": ["tech1", "tech2"],
      "folderStructure": "string",
      "features": ["feature1", "feature2"],
      "steps": ["step1", "step2"]
    }
  ]
}
Generate exactly 3 projects.`;

    const userPrompt = `User skills: ${profile.skills?.join(', ')}, Interests: ${profile.interests?.join(', ')}, Level: ${level || 'beginner'}. Suggest 3 relevant coding projects.`;

    let projectsData;
    try {
      projectsData = await callAI(systemPrompt, userPrompt);
    } catch (aiError) {
      projectsData = {
        projects: [{
          title: "To-Do App",
          description: "Simple CRUD app",
          techStack: ["React", "Tailwind"],
          folderStructure: "src/components, src/pages",
          features: ["Add task", "Delete task"],
          steps: ["Setup project", "Build UI", "Add logic"]
        }]
      };
    }

    await db.collection('projects_results').doc(userId).set({ ...projectsData, generatedAt: new Date().toISOString() });
    res.json(projectsData);
  } catch (error) {
    console.error('Projects error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { generateProjects };