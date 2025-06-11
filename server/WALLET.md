# Wallet Module Documentation

The wallet module provides secure digital wallet functionality for JyotishConnect users, enabling seamless financial transactions for astrology consultations and services.

## Overview

The wallet system uses a **paise-based** approach (1 INR = 100 paise) for precise financial calculations and includes a dummy payment provider for testing and development purposes.

---

## API Endpoints

All wallet endpoints require JWT authentication and are prefixed with `/api/v1/wallet`.

### **GET /balance**

Retrieve the current wallet balance for the authenticated user.

**Request:**
```http
GET /api/v1/wallet/balance
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "balancePaise": 50000
  }
}
```

---

### **POST /recharge**

Recharge wallet using the integrated dummy payment provider.

**Request:**
```http
POST /api/v1/wallet/recharge
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "amountPaise": 10000
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "balancePaise": 60000,
    "transaction": {
      "type": "recharge",
      "amountPaise": 10000,
      "description": "Wallet recharge via dummy payment provider",
      "transactionId": "uuid-generated-id",
      "timestamp": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

**Validation Rules:**
- `amountPaise` must be a positive integer
- Minimum amount: 1 paise
- Maximum amount: No limit (configurable)

**Error Responses:**
```json
// Invalid amount
{
  "success": false,
  "message": "Invalid amount. Amount must be a positive number in paise."
}

// Unauthenticated
{
  "success": false,
  "message": "Authentication required"
}
```

---

### **GET /transactions**

Retrieve the complete transaction history for the user's wallet.

**Request:**
```http
GET /api/v1/wallet/transactions
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "type": "recharge",
        "amountPaise": 10000,
        "description": "Wallet recharge via dummy payment provider",
        "transactionId": "uuid-generated-id",
        "timestamp": "2024-01-15T10:30:00.000Z"
      },
      {
        "type": "debit",
        "amountPaise": 5000,
        "description": "Chat consultation with astrologer",
        "transactionId": "another-uuid",
        "timestamp": "2024-01-15T11:00:00.000Z"
      }
    ]
  }
}
```

---

## Database Schema

### Wallet Model

```javascript
{
  userId: ObjectId,           // Reference to User model
  balancePaise: Number,       // Balance in paise (default: 0)
  history: [Transaction],     // Array of transaction objects
  createdAt: Date,
  updatedAt: Date
}
```

### Transaction Schema (Embedded)

```javascript
{
  type: String,               // 'recharge', 'debit', 'credit'
  amountPaise: Number,        // Transaction amount in paise
  description: String,        // Human-readable description
  transactionId: String,      // Unique UUID for the transaction
  timestamp: Date            // Transaction timestamp
}
```

---

## Frontend Integration

### Redux Store

The wallet state is managed using Redux Toolkit with the following structure:

```typescript
interface WalletState {
  balancePaise: number;
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
}
```

### Available Actions

- `fetchWallet()` - Fetch current wallet balance
- `rechargeWallet(amountPaise)` - Recharge wallet
- `fetchTransactions()` - Get transaction history
- `clearWalletError()` - Clear error state

### Usage Example

```typescript
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchWallet, rechargeWallet, selectWalletBalance } from '@/redux/walletSlice';

// In component
const dispatch = useAppDispatch();
const balance = useAppSelector(selectWalletBalance);

// Fetch balance
useEffect(() => {
  dispatch(fetchWallet());
}, [dispatch]);

// Recharge wallet
const handleRecharge = (amount: number) => {
  dispatch(rechargeWallet(amount * 100)); // Convert rupees to paise
};
```

### UI Components

The wallet balance is displayed in the navigation header as a green pill badge:

```jsx
<div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium border border-green-200">
  ₹{formatBalance(walletBalance)}
</div>
```

---

## Dummy Payment Provider

The system includes a built-in dummy payment provider for development and testing:

### Features
- **Always Succeeds**: All payment requests return success
- **Realistic Delay**: Simulates 100ms processing time
- **UUID Generation**: Creates unique transaction IDs
- **Comprehensive Logging**: Full audit trail

### Implementation
```javascript
class DummyPaymentProvider {
  static async processPayment(amountPaise, userId) {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      success: true,
      transactionId: uuidv4(),
      amountPaise,
      timestamp: new Date()
    };
  }
}
```

---

## Testing

### Running Tests

```bash
cd server
npm test
```

### Test Coverage

The wallet module includes comprehensive Mocha tests:

- ✅ **Balance Retrieval**: Get wallet balance for authenticated users
- ✅ **Successful Recharge**: Valid amount processing
- ✅ **Validation Tests**: Negative amounts, zero amounts, non-numeric values
- ✅ **Authentication**: Unauthenticated request handling
- ✅ **Transaction History**: Multiple recharge tracking
- ✅ **Error Handling**: Proper error responses

### Test Examples

```javascript
// Successful recharge test
it('should successfully recharge wallet with valid amount', async () => {
  const res = await chai.request(app)
    .post('/api/v1/wallet/recharge')
    .set('Authorization', `Bearer ${authToken}`)
    .send({ amountPaise: 10000 });

  expect(res).to.have.status(200);
  expect(res.body.data.balancePaise).to.be.at.least(10000);
});

// Negative amount validation test
it('should fail with negative amount', async () => {
  const res = await chai.request(app)
    .post('/api/v1/wallet/recharge')
    .set('Authorization', `Bearer ${authToken}`)
    .send({ amountPaise: -1000 });

  expect(res).to.have.status(400);
  expect(res.body.message).to.include('Invalid amount');
});
```

---

## Security Considerations

### Authentication
- All endpoints require valid JWT tokens
- User can only access their own wallet data
- Tokens are verified on every request

### Data Validation
- Strict input validation for all amounts
- Type checking for numeric values
- Range validation for transaction amounts

### Transaction Integrity
- UUID-based transaction IDs prevent duplicates
- Immutable transaction history
- Audit trail for all operations

---

## Future Enhancements

### Payment Gateway Integration
- Replace dummy provider with real payment gateways
- Support multiple payment methods
- Handle payment failures and retries

### Advanced Features
- Wallet-to-wallet transfers
- Scheduled payments
- Payment notifications
- Transaction categories
- Spending analytics

### Security Improvements
- Transaction signing
- Two-factor authentication for large amounts
- Rate limiting for transactions
- Fraud detection algorithms

---

## Manual Database Migration

Since this is a new wallet module, existing users will need wallet documents created. The system handles this automatically:

1. **Automatic Creation**: Wallets are created when first accessed
2. **Default Balance**: New wallets start with 0 paise
3. **Migration Script**: Optional script for bulk wallet creation

### Manual Migration Script (if needed)

```javascript
// Create wallets for all existing users
const User = require('./models/user.model');
const Wallet = require('./models/wallet.model');

async function createWalletsForExistingUsers() {
  const users = await User.find({});
  
  for (const user of users) {
    const existingWallet = await Wallet.findOne({ userId: user._id });
    if (!existingWallet) {
      await new Wallet({
        userId: user._id,
        balancePaise: 0,
        history: []
      }).save();
      console.log(`Created wallet for user: ${user.email}`);
    }
  }
}
```

---

## Support and Troubleshooting

### Common Issues

1. **Balance Not Updating**: Check Redux state synchronization
2. **Authentication Errors**: Verify JWT token validity
3. **Transaction Failures**: Review validation requirements

### Debug Mode

Enable debug logging by setting environment variable:
```bash
DEBUG=wallet:* npm start
```

### Monitoring

Monitor wallet operations through:
- Server logs for transaction processing
- Database queries for balance verification
- Frontend Redux DevTools for state changes 