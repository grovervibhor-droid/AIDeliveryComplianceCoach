const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Updated to use environment variable for API key
const endpoint = 'https://ameya-3557-resource.cognitiveservices.azure.com/openai/deployments/gpt-4o-mini/chat/completions?api-version=2023-03-15-preview';
const apiKey = process.env.AZURE_OPENAI_KEY;

app.post('/api/recommendations', async (req, res) => {
  const { industry, region, fileContent } = req.body;
  const prompt = `You are a compliance expert. Analyze the following project document for industry: ${industry}, region: ${region}. Identify any compliance gaps and provide recommendations.\n\nDocument Content:\n${fileContent}`;

  try {
    const response = await axios.post(
      endpoint,
      {
        messages: [
          { role: "system", content: "You are a compliance expert." },
          { role: "user", content: prompt }
        ],
        max_tokens: 800
      },
      {
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json'
        }
      }
    );
    res.json({ recommendations: response.data.choices[0].message.content });
  } catch (err) {
    res.status(500).json({ error: 'Azure OpenAI error', details: err.message });
  }
});

app.listen(5000, () => console.log('Server running on port 5000'));
