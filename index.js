const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId, ServerApiVersion } = require("mongodb");
require("dotenv").config();
const cookieParser = require("cookie-parser");

const app = express();
const port = process.env.PORT || 9000;

app.use(cors());
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.stnyf.mongodb.net/ShomvobTravels?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
});

// Database connection state
let db;
let isConnecting = false;
let collections = {};

async function connectDB() {
  if (db) return db;
  if (isConnecting) {
    // Wait for existing connection attempt
    return new Promise(resolve => {
      const check = setInterval(() => {
        if (db) {
          clearInterval(check);
          resolve(db);
        }
      }, 100);
    });
  }

  isConnecting = true;
  try {
    await client.connect();
    db = client.db();
    
    // Initialize collections
    collections = {
      users: db.collection("users"),
      packages: db.collection("packages"),
      bookings: db.collection("bookings"),
      transactions: db.collection("transactions"),
      tourGuides: db.collection("tourGuides"),
      stories: db.collection("stories"),
      applications: db.collection("applications"),
      adminAnalytics: db.collection("adminAnalytics"),
      announcements: db.collection("announcements")
    };
    
    console.log("✅ Connected to MongoDB!");
    isConnecting = false;
    return db;
  } catch (error) {
    isConnecting = false;
    console.error("❌ MongoDB connection error:", error);
    throw error;
  }
}

// Database middleware - ensures connection before handling requests
app.use(async (req, res, next) => {
  try {
    await connectDB();
    req.collections = collections;
    next();
  } catch (error) {
    res.status(500).json({ error: "Database connection failed" });
  }
});

// Routes
app.get("/", (req, res) => res.send("Shomvob Travels API is running"));

// User Routes
app.get('/user', async (req, res) => {
  try {
    const result = await req.collections.users.find().toArray();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add all your other routes here following the same pattern...

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error" });
});

// Start server
async function startServer() {
  try {
    await connectDB(); // Test connection first
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Export for serverless environments
module.exports = app;

// Start server if not in serverless environment
if (require.main === module) {
  startServer();
}