const express = require("express");
const cors = require("cors");
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


let PackagesC,BookingsC,TransactionsC,TourGuidesC,StoriesC,ApplicationsC,AdminAnalyticsC,AnnouncementsC
async function connectDB() {
  try {
    await client.connect();
    console.log("Connected to MongoDB!");
    const database = client.db("ShomvobTravels");
    PackagesC = database.collection("packages");
    BookingsC = database.collection("bookings");
    TransactionsC = database.collection("transactions");
    TourGuidesC = database.collection("tourGuides");
    StoriesC = database.collection("stories");
    ApplicationsC = database.collection("applications");
    AdminAnalyticsC = database.collection("adminAnalytics");
    AnnouncementsC = database.collection("announcements");
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  }
}

// Call the function to connect to DB
connectDB();

app.get("/", (req, res) => res.send("Hello World!"));
app.get("/trips", async (req, res) => {
  try {
      const packages = await PackagesC.find().toArray();
      res.json(packages);
  } catch (error) {
      console.error("Fetch error:", error);
      res.status(500).json({ message: "Failed to fetch packages", error: error.message });
  }
});
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
