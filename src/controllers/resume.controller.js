const { db } = require('../config/firebase');
const { callAI } = require('../services/ai.service');

const generateResume = async (req, res) => {
  try {
    const {
      userId,
      existingResumeText,
      requestMode,
      tools,
      workExperience,
      certifications,
      name,
      dreamJob,
      skills,
      education,
      university,
      github
    } = req.body;

    if (!userId) return res.status(400).json({ success: false, error: 'userId is required' });

    const isImproveMode = requestMode === 'improve';
    const hasDirectOverrides = name || dreamJob || skills || education || university || github;

    if (!isImproveMode && !hasDirectOverrides) {
      const cachedDoc = await db.collection('resume_results').doc(userId).get();
      if (cachedDoc.exists) {
        return res.json(cachedDoc.data());
      }
    }

    const userDoc = await db.collection('users').doc(userId).get();
    const storedProfile = userDoc.exists ? userDoc.data() : {};

    const profile = {
      name: name || storedProfile.name,
      dreamJob: dreamJob || storedProfile.dreamJob,
      skills: skills || storedProfile.skills,
      degree: education || storedProfile.degree,
      university: university || storedProfile.university,
      github: github || storedProfile.github
    };

    const skillsText = Array.isArray(profile.skills) ? profile.skills.join(', ') : (profile.skills || 'Not specified');
    const toolsText = Array.isArray(tools) && tools.length
  ? tools.join(', ')
  : (typeof tools === 'string' && tools.trim() ? tools : 'None specified');

const workExpText = Array.isArray(workExperience) && workExperience.length
  ? workExperience.map(w => {
      if (typeof w === 'string') return w;
      return `${w?.title || w?.role || 'Role'} at ${w?.company || 'Company'} (${w?.duration || 'duration not specified'}): ${w?.description || ''}`;
    }).join(' | ')
  : (typeof workExperience === 'string' && workExperience.trim()
      ? workExperience
      : 'No prior work experience — highlight academic projects and skills instead');

const certsText = Array.isArray(certifications) && certifications.length
  ? certifications.join(', ')
  : (typeof certifications === 'string' && certifications.trim() ? certifications : 'None');

    const systemPrompt = `You are a resume writer AI. Respond ONLY with valid JSON, no explanations, no markdown, matching this exact structure:
{
  "resumeText": "string",
  "linkedinSummary": "string",
  "coverLetter": "string"
}
Use ONLY the information given below. Do not invent or substitute names, skills, or education not provided. Never write "None" as a value for missing sections — instead, either omit that section gracefully or emphasize other strengths so the resume reads naturally.`;

    let userPrompt;
    if (isImproveMode && existingResumeText) {
      userPrompt = `Here is the user's existing resume text:\n"""${existingResumeText}"""\n\nImprove this resume — make the language more professional, fix weak phrasing, and better highlight achievements. Do NOT rewrite it from scratch or lose key facts already present.\n\nUser context:\nName: ${profile.name}, Degree: ${profile.degree}, University: ${profile.university}\nSkills: ${skillsText}\nTools: ${toolsText}\nWork Experience: ${workExpText}\nCertifications: ${certsText}\nDream job: ${profile.dreamJob}, GitHub: ${profile.github}\n\nAlso generate a matching LinkedIn summary and cover letter.`;
    } else {
      userPrompt = `Generate a professional resume, LinkedIn summary, and cover letter for exactly this person — do not substitute any other name or details:\nName: ${profile.name}\nDegree: ${profile.degree}\nUniversity: ${profile.university}\nSkills: ${skillsText}\nTools: ${toolsText}\nWork Experience: ${workExpText}\nCertifications: ${certsText}\nDream job: ${profile.dreamJob}\nGitHub: ${profile.github}`;
    }

    let resumeData;
    try {
      resumeData = await callAI(systemPrompt, userPrompt);
    } catch (aiError) {
      resumeData = {
        resumeText: existingResumeText || `${profile.name} - ${profile.degree} graduate seeking ${profile.dreamJob} role, skilled in ${skillsText}.`,
        linkedinSummary: `Aspiring ${profile.dreamJob} with skills in ${skillsText}.`,
        coverLetter: `Dear Hiring Manager, I am excited to apply for the ${profile.dreamJob} position...`
      };
    }

    if (!hasDirectOverrides) {
      await db.collection('resume_results').doc(userId).set({ ...resumeData, generatedAt: new Date().toISOString() });
    }

    res.json(resumeData);
  } catch (error) {
    console.error('Resume error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { generateResume };
