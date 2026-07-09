const axios = require('axios');

const callAI = async (systemPrompt, userPrompt) => {
  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.1-8b-instant',
        max_tokens: 2000,
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

    const rawText = response.data.choices[0].message.content;
    const cleaned = rawText.replace(/```json|```/g, '').trim();

    return JSON.parse(cleaned);
  } catch (error) {
    console.error('AI call failed:', error.response?.data || error.message);
    throw new Error('AI service failed');
  }
};

module.exports = { callAI };