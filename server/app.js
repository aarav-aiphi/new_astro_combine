const express      = require('express');
const cors         = require('cors');
const cookieParser = require('cookie-parser');
const errorHandler = require('./middlewares/errorHandler');
const mongoose     = require('mongoose');
const dotenv       = require('dotenv');
const initializeRoutes = require('./routes/_index');   // helper we create next
const { billingEngine } = require('./services/BillingEngine.js');
const BillingSession = require('./models/billingSession.model');

dotenv.config();

const app = express();
app.set('trust proxy', 1);

// ============== DB Connection =============
if (!mongoose.connection.readyState) {
  mongoose.connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
    .then(async () => {
      console.log("db connected successfully");
      
      // Initialize billing engine with existing active sessions
      await initializeBillingEngine();
    })
    .catch((err) => {
      console.log("err in connecting to database", err);
      if (process.env.NODE_ENV !== 'test') {
        process.exit(1);
      }
    });
}

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());
app.use(errorHandler);

// pull in every modular route in one place
initializeRoutes(app);

// ============== Billing Engine Initialization =============
async function initializeBillingEngine() {
  try {
    if (process.env.NODE_ENV === 'test') {
      return; // Skip billing engine in test mode
    }

    console.log('🔄 Initializing billing engine...');
    
    // Find all active billing sessions
    const activeSessions = await BillingSession.find({ live: true });
    
    if (activeSessions.length === 0) {
      console.log('✅ No active billing sessions to restore');
      return;
    }

    console.log(`📊 Found ${activeSessions.length} active billing sessions to restore`);
    
    // Clear any existing intervals
    billingEngine.activeSessions.clear();
    
    // Create a generic socket emitter for server-side billing
    const serverSocket = {
      emit: (event, data) => {
        // Emit to all connected sockets via global io instance if available
        if (global.io) {
          global.io.emit(event, data);
        }
      }
    };

    // Restart intervals for each active session
    for (const session of activeSessions) {
      try {
        const intervalId = setInterval(async () => {
          try {
            await billingEngine.processTick(session._id.toString(), serverSocket);
          } catch (error) {
            console.error(`💳 Error in billing tick for session ${session._id}:`, error.message);
          }
        }, billingEngine.TICK_SECONDS * 1000);

        billingEngine.activeSessions.set(session._id.toString(), intervalId);
        console.log(`✅ Restored billing for session ${session._id} (${session.sessionType})`);
      } catch (error) {
        console.error(`❌ Failed to restore billing for session ${session._id}:`, error.message);
      }
    }

    console.log(`🎉 BillingEngine initialized with ${billingEngine.activeSessions.size} active sessions`);
    console.log(`⏱️  Tick interval: ${billingEngine.TICK_SECONDS} seconds`);
    
  } catch (error) {
    console.error('❌ Failed to initialize billing engine:', error);
  }
}

module.exports = app; 