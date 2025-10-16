# Compliance Coach Backend

Production-ready Node.js/Express backend for AI-powered compliance recommendations.

## Features

✅ **Security**
- Helmet.js for security headers
- CORS with configurable origins
- Input validation with Joi
- Environment variable management
- No hardcoded credentials

✅ **Error Handling**
- Global error handler
- Uncaught exception handling
- Unhandled promise rejection handling
- Detailed error logging

✅ **Logging**
- Winston logger with file and console transports
- Request logging
- Error logging with stack traces
- Configurable log levels

✅ **Rate Limiting**
- Express rate limiter (100 requests per 15 minutes by default)
- Configurable via environment variables

✅ **Monitoring**
- Health check endpoint (`/api/health`)
- Reports API key configuration status
- Timestamp and version tracking

✅ **Production Ready**
- NODE_ENV checks
- Production-specific error messages
- API key validation on startup
- Graceful shutdown handling

## Prerequisites

- Node.js 14+ 
- Azure OpenAI API access
- Environment variables configured

## Installation

```bash
cd backend
npm install
```

## Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Update `.env` with your values:
```env
AZURE_OPENAI_KEY=your_actual_api_key
NODE_ENV=production
ALLOWED_ORIGINS=https://yourdomain.com
PORT=5000
RATE_LIMIT=100
LOG_LEVEL=info
```

## Running the Server

### Development
```bash
npm start
# or
node server.js
```

### Production
```bash
NODE_ENV=production node server.js
```

## API Endpoints

### Health Check
```
GET /api/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-16T12:00:00.000Z",
  "version": "1.0.0",
  "service": "AI Delivery Compliance Coach",
  "checks": {
    "database": "not applicable",
    "azure_openai": "configured"
  }
}
```

### Recommendations
```
POST /api/recommendations
Content-Type: application/json
```

Request Body:
```json
{
  "industry": "Healthcare",
  "region": "US",
  "fileContent": "Project document content..."
}
```

Response:
```json
{
  "recommendations": "Structured compliance recommendations..."
}
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `AZURE_OPENAI_KEY` | Yes | - | Azure OpenAI API key |
| `NODE_ENV` | No | development | Environment mode |
| `PORT` | No | 5000 | Server port |
| `ALLOWED_ORIGINS` | No | * | CORS allowed origins (comma-separated) |
| `RATE_LIMIT` | No | 100 | Requests per 15 min per IP |
| `LOG_LEVEL` | No | info | Logging level (error/warn/info/debug) |

## Logging

Logs are written to:
- `error.log` - Error level logs only
- `combined.log` - All logs
- Console - In development mode only

## Security Best Practices

1. **Always use HTTPS** in production (configure at reverse proxy/load balancer level)
2. **Set ALLOWED_ORIGINS** to your actual frontend domain
3. **Store API keys** in environment variables, never in code
4. **Enable rate limiting** to prevent abuse
5. **Use strong authentication** for production deployments
6. **Keep dependencies updated** regularly

## Deployment

### Azure App Service
1. Set environment variables in App Service Configuration
2. Deploy via GitHub Actions or Azure CLI
3. Ensure Application Insights is enabled for monitoring

### Docker
```bash
docker build -t compliance-coach-backend .
docker run -p 5000:5000 --env-file .env compliance-coach-backend
```

## Monitoring

- Use the `/api/health` endpoint for uptime monitoring
- Check `error.log` and `combined.log` for issues
- Set up Application Insights or similar for production monitoring

## Troubleshooting

### API Key Errors
- Verify `AZURE_OPENAI_KEY` is set correctly
- Check Azure OpenAI service is active
- Ensure API key hasn't expired

### CORS Errors
- Set `ALLOWED_ORIGINS` to include your frontend domain
- Ensure protocol (http/https) matches

### Rate Limit Errors
- Increase `RATE_LIMIT` if needed
- Consider per-user authentication instead of IP-based limiting

## License

MIT
