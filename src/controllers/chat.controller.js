const { db } = require('../config/firebase');
const { callAI } = require('../services/ai.service');

const chatWithAI = async (req, res) => {
  try {
    const { userId, message } = req.body;

    if (!userId || !message) {
      return res.status(400).json({ success: false, error: 'userId and message are required' });
    }

    // Get user profile for context (optional personalization)
    const userDoc = await db.collection('users').doc(userId).get();
    const profile = userDoc.exists ? userDoc.data() : {};

    // Get previous chat history (last 10 messages)
    const chatDoc = await db.collection('chats').doc(userId).get();
    const history = chatDoc.exists ? chatDoc.data().messages || [] : [];

    const systemPrompt = `You are a friendly AI career and life assistant for a student named ${profile.name || 'the user'}. 
Their dream job is ${profile.dreamJob || 'not specified'}, and their skills include ${profile.skills?.join(', ') || 'unknown'}.
Give helpful, encouraging, and concise answers (2-4 sentences unless more detail is asked). Do not respond in JSON — respond in plain conversational text.`;

    // Build conversation context (last few messages)
    const recentHistory = history.slice(-6).map(h => `${h.role}: ${h.content}`).join('\n');
    const userPrompt = recentHistory
      ? `Previous conversation:\n${recentHistory}\n\nUser: ${message}`
      : message;

    let aiReply;
    try {
      // Note: chat needs plain text, not JSON — use axios directly here
      const axios = require('axios');
      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'llama-3.1-8b-instant',
          max_tokens: 500,
          temperature: 0.7,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ]
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      aiReply = response.data.choices[0].message.content;
    } catch (aiError) {
      aiReply = "Sorry, I'm having trouble responding right now. Please try again in a moment.";
    }

    // Save updated history
    const updatedHistory = [
      ...history,
      { role: 'user', content: message, timestamp: new Date().toISOString() },
      { role: 'assistant', content: aiReply, timestamp: new Date().toISOString() }
    ];

    await db.collection('chats').doc(userId).set({ messages: updatedHistory });

    res.json({ success: true, reply: aiReply });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { chatWithAI };