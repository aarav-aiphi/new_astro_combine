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
      
      // Initialize billing engine (without auto-restoring sessions)
      await initializeBillingEngine();
    })
    .catch((err) => {
      console.log("err in connecting to database", err);
      if (process.env.NODE_ENV !== 'test') {
        process.exit(1);
      }
    });
}

// ============== CORS Configuration =============
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173", 
  "https://your-app-name.azurewebsites.net", // Replace with your actual Azure App Service domain
  process.env.FRONTEND_URL // Allow setting via environment variable
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // Handle preflight requests
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
      console.log('✅ No active billing sessions found - billing engine ready');
      return;
    }

    console.log(`⚠️  Found ${activeSessions.length} orphaned billing session(s) from previous server run`);
    console.log('🔄 Auto-ending orphaned sessions to prevent unwanted charges...');
    
    // Auto-end any orphaned sessions (sessions that were active when server was last shut down)
    // These sessions should not continue billing when server restarts
    for (const session of activeSessions) {
      try {
        const finalCost = session.calculateCurrentCost();
        session.live = false;
        session.endedAt = new Date();
        session.totalCostPaise = finalCost;
        await session.save();
        
        console.log(`⏹️  Ended orphaned session ${session._id} (${session.sessionType}) - Final cost: ${finalCost} paise`);
      } catch (error) {
        console.error(`❌ Failed to end orphaned session ${session._id}:`, error.message);
      }
    }

    console.log(`✅ BillingEngine initialized - ${activeSessions.length} orphaned session(s) ended`);
    console.log(`⏱️  Tick interval: ${billingEngine.TICK_SECONDS} seconds`);
    console.log('💡 Sessions will only be created when users actively join chats');
    
  } catch (error) {
    console.error('❌ Failed to initialize billing engine:', error);
  }
}

module.exports = app; 