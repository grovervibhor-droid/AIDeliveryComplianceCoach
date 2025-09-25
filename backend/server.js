const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Health check endpoint for monitoring
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'AI Delivery Compliance Coach',
    checks: {
      database: 'not applicable',
      azure_openai: apiKey ? 'configured' : 'missing key'
    }
  });
});

// Updated to use environment variable for API key
const endpoint = 'https://ameya-3557-resource.cognitiveservices.azure.com/openai/deployments/gpt-4o-mini/chat/completions?api-version=2023-03-15-preview';
const apiKey = process.env.AZURE_OPENAI_KEY;

app.post('/api/recommendations', async (req, res) => {
  const { industry, region, fileContent } = req.body;
  const prompt = `Based on this project document from ${industry} industry in ${region}, analyze the project requirements and identify specific compliance gaps, then provide structured Microsoft 365 tenant recommendations.

Focus ONLY on actions that can be performed within Microsoft 365 tenant - creating policies, changing settings, configuring compliance features, etc.

STRUCTURE YOUR RESPONSE EXACTLY AS FOLLOWS:

For each compliance issue found, provide:

**GAP:** [Brief title of the compliance gap]
**DESCRIPTION:** [Detailed explanation of what is missing or inadequate]
**RECOMMENDATION:** [What needs to be implemented to address this gap]
**ACTION:** [Specific steps to take in Microsoft 365]
**CONFIGURATION:** [Exact settings, values, and parameters to configure]

Focus on M365 services such as:
- Azure AD Conditional Access policies
- Microsoft Purview data classification and retention policies
- Microsoft Defender security settings
- Compliance Manager assessments
- Data Loss Prevention (DLP) policies
- Information Protection sensitivity labels
- Exchange Online protection settings
- SharePoint and OneDrive compliance configurations
- Teams security settings
- Multi-factor authentication policies

Based on ${industry} industry standards and ${region} regulatory requirements.

IGNORE: Infrastructure, on-premises systems, third-party tools, hardware configurations, or anything outside Microsoft 365 tenant.

Document Content:
${fileContent}

Provide 2-4 structured recommendations that can be implemented immediately through M365 admin portals.`;

  try {
    const response = await axios.post(
      endpoint,
      {
        messages: [
          { role: "system", content: "You are an expert IT infrastructure and compliance consultant who specializes in helping organizations implement secure, compliant environments. Your role is to provide specific, actionable recommendations for configuring customer environments and infrastructure - never suggest document changes. Focus on real-world implementation steps for IT teams." },
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
