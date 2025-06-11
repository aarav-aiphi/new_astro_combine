# Environment Setup for Billing System

## Manual .env Configuration

Add the following environment variable to your `.env` file:

```bash
# Billing Configuration
TICK_SECONDS=15  # Billing tick interval in seconds (default: 15)
```

## Configuration Options

### TICK_SECONDS
Controls how frequently billing deductions occur during consultations.

**Recommended values:**
- `15` - Standard (recommended for production)
- `10` - Medium frequency 
- `5` - High frequency (for testing)
- `30` - Low frequency (for low-activity periods)

### Example Production .env

```bash
# Database
MONGODB_URL=your_mongodb_connection_string

# Authentication  
JWT_SECRET=your_jwt_secret

# Billing
TICK_SECONDS=15

# Server
PORT=7000

# External APIs
VEDASTRO_API_BASE_URL=http://localhost:3001
AI_API_KEY=your_ai_api_key
```

## Database Migration (Optional)

If you have existing astrologers without billing rates, run this migration:

```javascript
// In MongoDB shell or migration script
db.astrologers.updateMany(
  { ratePaisePerMin: { $exists: false } },
  { 
    $set: { 
      ratePaisePerMin: { $multiply: ["$costPerMinute", 100] },
      ratePaisePerMinChat: { $multiply: ["$costPerMinute", 100] },
      ratePaisePerMinCall: { $multiply: ["$costPerMinute", 100] }
    }
  }
);
```

## Installation Commands

### Server Dependencies
```bash
cd server
npm install sinon  # For testing
```

### Client Dependencies  
```bash
cd client
npm install @playwright/test
npx playwright install
```

## Running Tests

### Unit Tests
```bash
cd server
npm test
```

### E2E Tests
```bash
cd client  
npm run test:e2e
```

## Development Commands

### Start with Billing Debug
```bash
cd server
DEBUG=billing:* npm run dev
```

### Monitor Billing Activity
```bash
# In another terminal
tail -f server.log | grep billing
```

## Production Deployment

1. Set `TICK_SECONDS=15` in production environment
2. Ensure MongoDB indexes are created for billing collections
3. Monitor billing session cleanup on server restart
4. Set up alerts for billing errors

## Troubleshooting

### Common Issues

1. **Billing not starting**: Check TICK_SECONDS is set
2. **Rate errors**: Verify astrologer ratePaisePerMin fields
3. **Socket issues**: Ensure authentication tokens are valid

### Debug Mode
```bash
cd server
TICK_SECONDS=5 DEBUG=billing:* npm run dev
```

This will enable verbose billing logs with 5-second tick intervals for debugging. 