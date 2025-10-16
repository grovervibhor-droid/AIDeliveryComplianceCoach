const express = require('express');
const cors = require('cors');
const axios = require('axios');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const Joi = require('joi');
const winston = require('winston');
const path = require('path');
require('dotenv').config();

// Configure Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'compliance-coach-backend' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Add console logging in non-production
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration - restrict in production
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parser
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

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

// Validate API key on startup
if (!apiKey) {
  logger.error('AZURE_OPENAI_KEY is not configured');
  if (process.env.NODE_ENV === 'production') {
    logger.error('Cannot start in production without API key');
    process.exit(1);
  }
}

// Input validation schema
const recommendationsSchema = Joi.object({
  industry: Joi.string().required().min(2).max(100),
  region: Joi.string().required().min(2).max(100),
  fileContent: Joi.string().required().min(10).max(50000)
});

app.post('/api/recommendations', async (req, res) => {
  // Validate input
  const { error, value } = recommendationsSchema.validate(req.body);
  if (error) {
    logger.warn('Validation error', { error: error.details });
    return res.status(400).json({ 
      error: 'Invalid input', 
      details: error.details.map(d => d.message) 
    });
  }

  const { industry, region, fileContent } = value;
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
    logger.info('Processing recommendations request', { industry, region });
    
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
    
    logger.info('Successfully generated recommendations');
    res.json({ recommendations: response.data.choices[0].message.content });
  } catch (err) {
    logger.error('Azure OpenAI error', { 
      error: err.message, 
      stack: err.stack,
      response: err.response?.data 
    });
    
    // Don't expose internal error details in production
    const errorMessage = process.env.NODE_ENV === 'production' 
      ? 'Failed to generate recommendations' 
      : err.message;
    
    res.status(500).json({ 
      error: 'Azure OpenAI error', 
      details: errorMessage 
    });
  }
});

// Serve static files from React app (in production)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../build')));
  
  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../build', 'index.html'));
  });
}

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { 
    error: err.message, 
    stack: err.stack,
    path: req.path 
  });
  
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', { error: err.message, stack: err.stack });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
  process.exit(1);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`, {
    nodeEnv: process.env.NODE_ENV || 'development',
    apiKeyConfigured: !!apiKey
  });
  console.log(`Server running on port ${PORT}`);
});
