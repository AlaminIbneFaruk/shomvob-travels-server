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


app.post('/user', async (req, res) => {
  const user = req.body;
  const result = await UsersC.insertOne(user);
  res.send(result);
});

app.patch('/user/update/:id', async (req, res) => {
  const id = req.params.id;
  const updateInfo = req.body;
  const result = await UsersC.updateOne(
    { _id: new ObjectId(id) },
    { $set: updateInfo }
  );
  res.send(result);
});

app.patch('/user/role/:email', async (req, res) => {
  const email = req.params.email;
  const { role } = req.body;
  const result = await UsersC.updateOne(
    { email },
    { $set: { role } }
  );
  res.send(result);
});

app.patch('/user/guide-request/:id', async (req, res) => {
  const id = req.params.id;
  const { status } = req.body;
  const result = await UsersC.updateOne(
    { _id: new ObjectId(id) },
    { $set: { guideRequestStatus: status } }
  );
  res.send(result);
});

app.delete('/user/:id', async (req, res) => {
  const id = req.params.id;
  const result = await UsersC.deleteOne({ _id: new ObjectId(id) });
  res.send(result);
});

// Package Routes
app.get('/package', async (req, res) => {
  const result = await PackagesC.find().toArray();
  res.send(result);
});

app.get('/package/random', async (req, res) => {
  const result = await PackagesC.aggregate([
    { $sample: { size: 3 } }
  ]).toArray();
  res.send(result);
});

app.get('/package/:id', async (req, res) => {
  const id = req.params.id;
  const result = await PackagesC.findOne({ _id: new ObjectId(id) });
  res.send(result);
});

app.post('/package', async (req, res) => {
  const package = req.body;
  const result = await PackagesC.insertOne(package);
  res.send(result);
});

app.patch('/package/:id', async (req, res) => {
  const id = req.params.id;
  const updateData = req.body;
  const result = await PackagesC.updateOne(
    { _id: new ObjectId(id) },
    { $set: updateData }
  );
  res.send(result);
});

app.delete('/package/:id', async (req, res) => {
  const id = req.params.id;
  const result = await PackagesC.deleteOne({ _id: new ObjectId(id) });
  res.send(result);
});

// Booking Routes
app.get('/booking', async (req, res) => {
  const result = await BookingsC.find().toArray();
  res.send(result);
});

app.get('/booking/user/:email', async (req, res) => {
  const email = req.params.email;
  const result = await BookingsC.find({ userEmail: email }).toArray();
  res.send(result);
});

app.get('/booking/guide/:email', async (req, res) => {
  const email = req.params.email;
  const result = await BookingsC.find({ guideEmail: email }).toArray();
  res.send(result);
});

app.post('/booking', async (req, res) => {
  const booking = req.body;
  const result = await BookingsC.insertOne(booking);
  res.send(result);
});

app.patch('/booking/:id', async (req, res) => {
  const id = req.params.id;
  const updateData = req.body;
  const result = await BookingsC.updateOne(
    { _id: new ObjectId(id) },
    { $set: updateData }
  );
  res.send(result);
});

app.delete('/booking/:id', async (req, res) => {
  const id = req.params.id;
  const result = await BookingsC.deleteOne({ _id: new ObjectId(id) });
  res.send(result);
});

// Tour Guide Routes
app.get('/guide', async (req, res) => {
  const result = await TourGuidesC.find().toArray();
  res.send(result);
});

app.get('/guide/random', async (req, res) => {
  const result = await TourGuidesC.aggregate([
    { $sample: { size: 4 } }
  ]).toArray();
  res.send(result);
});

app.get('/guide/:email', async (req, res) => {
  const email = req.params.email;
  const result = await TourGuidesC.findOne({ email });
  res.send(result);
});

app.post('/guide', async (req, res) => {
  const guide = req.body;
  const result = await TourGuidesC.insertOne(guide);
  res.send(result);
});

app.patch('/guide/:email', async (req, res) => {
  const email = req.params.email;
  const updateData = req.body;
  const result = await TourGuidesC.updateOne(
    { email },
    { $set: updateData }
  );
  res.send(result);
});

app.delete('/guide/:id', async (req, res) => {
  const id = req.params.id;
  const result = await TourGuidesC.deleteOne({ _id: new ObjectId(id) });
  res.send(result);
});

// Story Routes
app.get('/story', async (req, res) => {
  const result = await StoriesC.find().toArray();
  res.send(result);
});

app.get('/story/user/:email', async (req, res) => {
  const email = req.params.email;
  const result = await StoriesC.find({ authorEmail: email }).toArray();
  res.send(result);
});

app.post('/story', async (req, res) => {
  const story = req.body;
  const result = await StoriesC.insertOne(story);
  res.send(result);
});

app.patch('/story/:id', async (req, res) => {
  const id = req.params.id;
  const updateData = req.body;
  const result = await StoriesC.updateOne(
    { _id: new ObjectId(id) },
    { $set: updateData }
  );
  res.send(result);
});

app.delete('/story/:id', async (req, res) => {
  const id = req.params.id;
  const result = await StoriesC.deleteOne({ _id: new ObjectId(id) });
  res.send(result);
});

// Payment Routes
app.get('/payment', async (req, res) => {
  const result = await TransactionsC.find().toArray();
  res.send(result);
});

app.post('/payment', async (req, res) => {
  const payment = req.body;
  const result = await TransactionsC.insertOne(payment);
  res.send(result);
});

app.post('/payment/intent', async (req, res) => {
  // Stripe payment intent implementation would go here
  res.send({ clientSecret: 'test_client_secret' });
});

// Admin Analytics Routes
app.get('/analytics', async (req, res) => {
  const usersCount = await UsersC.countDocuments();
  const packagesCount = await PackagesC.countDocuments();
  const guidesCount = await TourGuidesC.countDocuments();
  const bookingsCount = await BookingsC.countDocuments();
  
  res.send({
    users: usersCount,
    packages: packagesCount,
    guides: guidesCount,
    bookings: bookingsCount
  });
});

app.get('/analytics/chart', async (req, res) => {
  const result = await BookingsC.aggregate([
    { $group: { _id: "$tourDate", count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]).toArray();
  res.send(result);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

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