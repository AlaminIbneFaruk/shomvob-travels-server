const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { MongoClient, ObjectId, ServerApiVersion } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.stnyf.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let UsersC, PackagesC, BookingsC, TransactionsC, TourGuidesC, StoriesC, ApplicationsC, AdminAnalyticsC, AnnouncementsC;

async function connectDB() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB!");

    const database = client.db("ShomvobTravels");
    UsersC = database.collection("users");
    PackagesC = database.collection("packages");
    // other collections...
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1); 
  }
}

connectDB();

app.get("/", (req, res) => res.send("Hello World!"));

// User Registration
app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  
  // Check if user already exists
  const existingUser = await UsersC.findOne({ username });
  if (existingUser) return res.status(400).json({ message: "User already exists" });

  const hashedPassword = await bcrypt.hash(password, 10);
  
  const newUser = { username, password: hashedPassword };
  await UsersC.insertOne(newUser);
  
  res.status(201).json({ message: "User registered successfully" });
});

// User Login
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = await UsersC.findOne({ username });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
  res.json({ token });
});

// Middleware to protect routes
const authenticateJWT = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user; // Save user info in request
    next();
  });
};

// Example of a protected route
app.get("/protected", authenticateJWT, (req, res) => {
  res.json({ message: "This is a protected route", user: req.user });
});

// Add your existing routes here...
app.get("/trip", async (req, res) => {
  try {
    if (!PackagesC) {
      return res.status(500).json({ message: "Database not initialized yet. Please try again later." });
    }
    const packages = await PackagesC.find().toArray();
    res.json(packages);
  } catch (error) {
    console.error("Fetch error:", error);
    res.status(500).json({ message: "Failed to fetch packages", error: error.message });
  }
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});