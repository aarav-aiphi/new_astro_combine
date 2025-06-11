# Real-Time Billing System

The JyotishConnect billing system provides accurate, real-time per-minute billing for astrology consultations with automatic wallet deductions and low-balance management.

## Overview

The billing system operates on a **tick-based algorithm** that deducts charges from user wallets at regular intervals during active consultations, ensuring precise billing and immediate balance monitoring.

## Architecture

### Core Components

1. **BillingEngine** - Central service managing all billing operations
2. **BillingSession** - Database model tracking consultation sessions
3. **Socket.IO Integration** - Real-time events for billing updates
4. **Redux State Management** - Frontend billing state handling

### Flow Diagram

```
User → Socket Event → BillingEngine → Database Updates → Socket Events → UI Updates
```

## Billing Algorithm

### Tick-Based Deduction

The system uses a configurable tick interval (default: 15 seconds) to deduct charges:

```
Deduction per tick = (Rate per minute ÷ 4)
```

**Example:**
- Rate: ₹30/minute (3000 paise)
- Tick interval: 15 seconds
- Deduction per tick: 3000 ÷ 4 = 750 paise

### Configuration

Set the tick interval via environment variable:

```bash
TICK_SECONDS=15  # Default: 15 seconds
```

**Supported intervals:**
- `5` - High frequency (5-second ticks)
- `10` - Medium frequency (10-second ticks)
- `15` - Standard frequency (15-second ticks) ⭐ **Recommended**
- `30` - Low frequency (30-second ticks)
- `60` - Minute-based ticks

### Rate Structure

Astrologers can set different rates for different consultation types:

```javascript
{
  ratePaisePerMin: 3000,        // Base rate (₹30/min)
  ratePaisePerMinChat: 2500,    // Chat rate (₹25/min)
  ratePaisePerMinCall: 3500     // Call rate (₹35/min)
}
```

## Session Lifecycle

### 1. Session Initiation

**Socket Event:** `consult:start`
```javascript
socket.emit('consult:start', {
  astrologerId: "64a1b2c3d4e5f6789012345",
  sessionType: "chat" // or "call"
});
```

**Process:**
1. Validate astrologer and rate
2. Check for existing active sessions
3. Create BillingSession in database
4. Start billing timer
5. Emit `consult:started` confirmation

### 2. Billing Ticks

**Automatic Process (every TICK_SECONDS):**
1. Calculate deduction amount
2. Check wallet balance
3. Deduct from wallet if sufficient
4. Update session elapsed time
5. Emit `billing:tick` event
6. If insufficient balance → emit `billing:low-balance`

**Tick Event Data:**
```javascript
{
  sessionId: "session_id",
  secondsElapsed: 45,
  balancePaise: 47250,
  deductedPaise: 750
}
```

### 3. Low Balance Handling

When balance < required deduction:
1. Emit `billing:low-balance` warning
2. Wait 30 seconds grace period
3. Emit `consult:end` with reason `insufficient_balance`
4. Stop billing session

### 4. Session Termination

**Socket Event:** `consult:end`
```javascript
socket.emit('consult:end', {
  sessionId: "optional_session_id",
  reason: "user_ended" // or "insufficient_balance", "user_disconnected"
});
```

**Process:**
1. Clear billing timer
2. Calculate final cost
3. Update session in database
4. Emit session ended events

## API Endpoints

### Get Session Receipt
```http
GET /api/v1/billing/session/:id
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "receipt": {
      "sessionId": "session_id",
      "astrologer": { "name": "Astrologer Name" },
      "sessionType": "chat",
      "ratePaisePerMin": 3000,
      "durationSeconds": 180,
      "durationMinutes": 3,
      "totalCostPaise": 9000,
      "costBreakdown": {
        "ratePerMinute": "₹30.00",
        "totalMinutes": 3,
        "totalCost": "₹90.00"
      }
    }
  }
}
```

### Get Billing History
```http
GET /api/v1/billing/history?page=1&limit=10
Authorization: Bearer <token>
```

### Get Active Session
```http
GET /api/v1/billing/active
Authorization: Bearer <token>
```

## Frontend Integration

### Redux Actions

```typescript
import { 
  fetchActiveSession,
  processBillingTick,
  setActiveSession,
  sessionEnded 
} from '@/redux/billingSlice';

// In component
const dispatch = useAppDispatch();

// Handle socket events
socket.on('billing:tick', (data) => {
  dispatch(processBillingTick(data));
});
```

### BillingDisplay Component

```jsx
import BillingDisplay from '@/components/BillingDisplay';

// In consultation screen
<BillingDisplay socket={socket} className="mb-4" />
```

### Tick math (updated 2025-06-06)

`deductionPaise = ceil(ratePaisePerMin × TICK_SECONDS ÷ 60)`

This formula ensures accurate billing regardless of the configured tick interval:
- 15s ticks: `ceil(3000 × 15 ÷ 60) = 750 paise`
- 10s ticks: `ceil(3000 × 10 ÷ 60) = 500 paise`
- 5s ticks: `ceil(3000 × 5 ÷ 60) = 250 paise`

### Atomic wallet debit

Each tick runs inside a MongoDB transaction with a `$gte` guard, preventing race-condition overdrafts:

```javascript
const walletUpdate = await Wallet.updateOne(
  { userId: sessionUserId, balancePaise: { $gte: deductionPaise } },
  { 
    $inc: { balancePaise: -deductionPaise },
    $push: { history: transaction }
  },
  { session: mongoSession }
);
```

This ensures that wallet deductions are atomic and prevent negative balances even under high concurrency.

**Features:**
- Real-time timer display
- Live cost tracking
- Low balance warning banner
- Session information

## Database Schema

### BillingSession Model

```javascript
{
  _id: ObjectId,
  userId: ObjectId,              // Reference to User
  astrologerId: ObjectId,        // Reference to Astrologer
  ratePaisePerMin: Number,       // Rate in paise per minute
  secondsElapsed: Number,        // Total session duration
  live: Boolean,                 // Session active status
  totalCostPaise: Number,        // Final cost (when ended)
  sessionType: String,           // 'chat' or 'call'
  createdAt: Date,              // Session start time
  endedAt: Date                 // Session end time
}
```

### Wallet Integration

Each billing tick creates a wallet transaction:

```javascript
{
  type: 'debit',
  amountPaise: 750,
  description: 'Consultation billing - 15s interval',
  transactionId: 'uuid',
  timestamp: Date
}
```

## Error Handling

### Common Scenarios

1. **Insufficient Balance**
   - Warning at 30s before termination
   - Graceful session end
   - Clear error messages

2. **Network Disconnection**
   - Automatic session cleanup
   - Resume billing on reconnection (if desired)

3. **Multiple Sessions**
   - Prevent concurrent billing sessions
   - Clear error messaging

4. **Rate Not Available**
   - Fallback to base rate
   - Error if no rates configured

## Performance Considerations

### Memory Management
- Active sessions stored in Map for O(1) lookup
- Automatic cleanup on session end
- Memory-efficient tick processing

### Database Optimization
- Indexed queries on userId and sessionId
- Batch operations for wallet updates
- Efficient aggregation for statistics

### Scalability
- Process-wide EventEmitter for cluster safety
- TODO: Redis adapter for multi-server deployment

## Security

### Authentication
- JWT token required for all operations
- User can only access own billing data
- Rate validation against astrologer profile

### Data Protection
- Immutable transaction history
- Audit trails for all operations
- Rate tampering prevention

## Monitoring & Analytics

### Billing Statistics
```http
GET /api/v1/billing/stats
Authorization: Bearer <admin_token>
```

**Metrics:**
- Active sessions count
- Average session duration
- Revenue per consultation type
- Low balance frequency

### Debug Information
- Console logging for all billing operations
- Session state tracking
- Error rate monitoring

## Testing

### Unit Tests
```bash
npm test -- --grep "Billing"
```

**Coverage:**
- ✅ Session creation and management
- ✅ Tick processing and deductions
- ✅ Low balance handling
- ✅ Multiple session prevention
- ✅ Cost calculations

### Integration Tests
- Socket.IO event handling
- Database transactions
- API endpoint responses

### Load Testing
- Concurrent session handling
- High-frequency tick processing
- Memory usage under load

## Deployment

### Environment Setup
```bash
# Required environment variables
TICK_SECONDS=15
MONGODB_URL=your_mongodb_url
JWT_SECRET=your_jwt_secret

# Optional
DEBUG=billing:*  # Enable debug logging
```

### Production Considerations
1. **Redis Clustering** (TODO)
   - Distribute billing across workers
   - Shared session state
   - Failover handling

2. **Database Sharding**
   - Partition by user or time
   - Optimize for read/write patterns

3. **Rate Limiting**
   - Prevent billing abuse
   - Socket connection limits

## Migration Guide

### Existing Systems
1. Backup existing billing data
2. Update astrologer rates to paise format
3. Run billing session migration
4. Test with small user group
5. Full deployment

### Rate Conversion
```sql
-- Convert existing rates to paise
UPDATE astrologers 
SET ratePaisePerMin = costPerMinute * 100 
WHERE ratePaisePerMin IS NULL;
```

## Troubleshooting

### Common Issues

**Session not starting:**
- Check astrologer rate configuration
- Verify user authentication
- Check for existing active sessions

**Billing not deducting:**
- Verify tick interval configuration
- Check wallet balance
- Monitor console logs

**UI not updating:**
- Verify socket connection
- Check Redux state updates
- Confirm billing event listeners

### Debug Commands
```bash
# View active sessions
node -e "console.log(require('./services/BillingEngine.js').billingEngine.getStats())"

# Check billing logs
grep "billing" server.log | tail -50
```

## Future Enhancements

### Planned Features
1. **Prepaid Packages** - Fixed-duration sessions
2. **Dynamic Pricing** - Peak hour rate adjustments
3. **Billing Analytics** - Revenue dashboards
4. **Refund System** - Automated refund processing
5. **Multi-Currency** - Support for different currencies

### API Extensions
- Bulk billing operations
- Scheduled billing sessions
- Billing webhooks for external systems
- Advanced reporting endpoints

---

## Support

For billing system issues:
1. Check this documentation
2. Review console logs
3. Test with minimal configuration
4. Contact development team with session IDs

**Configuration Summary:**
- Default tick interval: 15 seconds
- Minimum rate: 1 paise per minute
- Maximum session duration: No limit
- Grace period for low balance: 30 seconds 