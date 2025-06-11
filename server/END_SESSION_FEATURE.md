# End Session Feature Documentation

## Overview
The End Session feature allows users to manually terminate their consultation sessions with astrologers. This provides users with full control over their billing and consultation duration.

## Feature Components

### 1. Frontend Components

#### BillingDisplay Component
- **Location**: `client/components/BillingDisplay.tsx`
- **New Features**:
  - "End Session" button in the billing display
  - Confirmation modal with session details
  - Loading state during session termination
  - Session ended notifications

#### ChatUI Component  
- **Location**: `client/app/chat-with-astrologer/chat/ChatUI.tsx`
- **New Features**:
  - Session ended notification banner
  - Real-time updates when sessions end
  - Different messages for different end reasons

### 2. Backend Components

#### Socket Event Handler
- **Location**: `server/chat/socket/billing.socket.js`
- **New Event**: `endSession`
- **Functionality**:
  - Handles user-initiated session termination
  - Notifies astrologer when user ends session
  - Proper error handling and logging

#### BillingEngine Integration
- **Uses existing**: `billingEngine.stopSession()` method
- **Reason tracking**: All session ends include reason codes
- **Atomic operations**: Ensures billing consistency

## User Flow

### 1. Starting End Session
1. User clicks "End Session" button in BillingDisplay
2. Confirmation modal appears showing:
   - Current session time
   - Amount spent so far
   - Astrologer name
3. User can either:
   - Continue Session (cancel)
   - End Session (confirm)

### 2. Processing End Session
1. Frontend emits `endSession` socket event
2. Backend validates session existence
3. BillingEngine stops the session with reason "user_requested"
4. Astrologer receives notification
5. User receives confirmation

### 3. Session Ended State
1. Billing stops immediately
2. Chat remains accessible (read-only)
3. Session ended notification appears
4. Wallet balance is updated
5. Session summary is available

## Socket Events

### Client → Server
```javascript
socket.emit('endSession', {
  sessionId: string,     // Optional - will find active session if not provided
  reason: 'user_requested'
});
```

### Server → Client
```javascript
// To user who ended session
socket.emit('consult:ended', {
  sessionId: string,
  reason: string,
  timestamp: Date
});

// To astrologer
socket.emit('session:ended-by-user', {
  sessionId: string,
  userId: string,
  reason: 'user_requested'
});
```

## Session End Reasons

| Reason | Description | Trigger |
|--------|-------------|---------|
| `user_requested` | User clicked End Session button | Manual user action |
| `insufficient_balance` | User ran out of money | Automatic billing system |
| `user_disconnected` | User's connection dropped | Network/browser close |
| `astrologer_ended` | Astrologer ended the session | Astrologer action |
| `system_error` | Technical error occurred | System failure |

## UI States

### 1. Active Session
- End Session button visible and enabled
- Billing display shows live consultation
- Chat input enabled (if balance sufficient)

### 2. Ending Session  
- End Session button shows loading spinner
- Button disabled to prevent double-clicks
- Confirmation modal closed

### 3. Session Ended
- No billing display (component hidden)
- Session ended notification banner
- Chat input disabled
- Historical messages remain visible

## Error Handling

### Common Scenarios
1. **No Active Session**: User sees "No active session found to end"
2. **Network Error**: Retry mechanism with user feedback
3. **Invalid Session ID**: Graceful error with retry option
4. **Double End Requests**: Idempotent handling

### Frontend Error Handling
```javascript
socket.on('error', (error) => {
  if (error.message === 'No active session found to end') {
    // Show appropriate user message
    // Refresh session state
  }
});
```

## Testing

### Test Script
- **Location**: `server/test-end-session.js`
- **Coverage**:
  - Session creation and termination
  - State validation
  - Error scenarios
  - Non-existent session handling

### Manual Testing Checklist
- [ ] End Session button appears during active session
- [ ] Confirmation modal shows correct session details
- [ ] Session terminates immediately upon confirmation
- [ ] Billing stops and wallet updates
- [ ] Astrologer receives notification
- [ ] Session ended notification appears
- [ ] Chat becomes read-only
- [ ] No billing display for ended sessions

## Security Considerations

### Authorization
- Users can only end their own sessions
- Session ownership validated via JWT token
- Socket authentication required

### Rate Limiting
- End session requests are not rate limited
- Users should be able to end sessions immediately

### Data Integrity
- Atomic session termination
- Consistent billing calculations
- Audit trail for all session ends

## Performance Impact

### Minimal Overhead
- Reuses existing `stopSession()` method
- No additional database queries
- Efficient socket event handling

### Optimizations
- Session state cached in Redux
- Real-time UI updates
- Graceful degradation for offline users

## Configuration

### Environment Variables
No new environment variables required.

### Feature Flags
Currently no feature flags - always enabled for live sessions.

## Future Enhancements

### Planned Features
1. **Session Ratings**: Allow users to rate sessions upon ending
2. **Session Summary**: Automatic summary generation on end
3. **Refund Handling**: Partial refunds for very short sessions
4. **Scheduled Ends**: Allow users to schedule session end times

### API Extensions
- REST API endpoint for ending sessions
- Bulk session management for admins
- Session analytics and reporting

## Troubleshooting

### Common Issues

#### End Session Button Not Visible
- Check if active session exists in Redux state
- Verify socket connection
- Ensure user role permissions

#### Session Not Ending
- Check network connectivity
- Verify socket event listeners
- Review server logs for errors

#### Billing Not Stopping
- Verify BillingEngine status
- Check database connection
- Review transaction logs

### Debug Commands
```javascript
// Check active session
store.getState().billing.activeSession

// Test socket connection
socket.emit('billing:status')

// Verify session state
billingEngine.getActiveSession(userId)
```

## API Reference

### Redux Actions
```javascript
import { sessionEnded } from '@/redux/billingSlice';

// Triggered automatically when session ends
dispatch(sessionEnded({
  sessionId: string,
  totalCostPaise: number,
  reason: string
}));
```

### Socket Methods
```javascript
// End current session
socket.emit('endSession', {
  sessionId: 'optional-session-id',
  reason: 'user_requested'
});
```

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Status**: Production Ready ✅ 