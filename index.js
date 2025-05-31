const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { MongoClient, ObjectId, ServerApiVersion } = require("mongodb");
require("dotenv").config();
const crypto = require("crypto");
const cookieParser = require("cookie-parser");

const app = express();
const port = process.env.PORT || 9000;

app.use(cors());
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.stnyf.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let UsersC,
  PackagesC,
  BookingsC,
  TransactionsC,
  TourGuidesC,
  StoriesC,
  ApplicationsC,
  AdminAnalyticsC,
  AnnouncementsC;

async function connectDB() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB!");

    const database = client.db("ShomvobTravels");
    UsersC = database.collection("users");
    PackagesC = database.collection("packages");
    BookingsC = database.collection("bookings");
    TransactionsC = database.collection("transactions");
    TourGuidesC = database.collection("tourGuides");
    StoriesC = database.collection("stories");
    ApplicationsC = database.collection("applications");
    AdminAnalyticsC = database.collection("adminAnalytics");
    AnnouncementsC = database.collection("announcements");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1);
  }
}

connectDB();

app.get("/", (req, res) => res.send("Hello World!"));
// user
 app.get('/user', async (req, res) => {
            const result = await usersCollection.find().toArray();
            res.send(result);
        });

        app.post('/user', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result);
        });

        app.patch('/user/update/:id', async (req, res) => {
            const id = req.params.id;
            const updateInfo = req.body;
            const result = await usersCollection.updateOne(
                { _id: new ObjectId(id) },
                { $set: updateInfo }
            );
            res.send(result);
        });

        app.patch('/user/role/:email', async (req, res) => {
            const email = req.params.email;
            const { role } = req.body;
            const result = await usersCollection.updateOne(
                { email },
                { $set: { role } }
            );
            res.send(result);
        });

        app.patch('/user/guide-request/:id', async (req, res) => {
            const id = req.params.id;
            const { status } = req.body;
            const result = await usersCollection.updateOne(
                { _id: new ObjectId(id) },
                { $set: { guideRequestStatus: status } }
            );
            res.send(result);
        });

        app.delete('/user/:id', async (req, res) => {
            const id = req.params.id;
            const result = await usersCollection.deleteOne({ _id: new ObjectId(id) });
            res.send(result);
        });

        // Package Routes
        app.get('/package', async (req, res) => {
            const result = await packagesCollection.find().toArray();
            res.send(result);
        });

        app.get('/package/random', async (req, res) => {
            const result = await packagesCollection.aggregate([
                { $sample: { size: 3 } }
            ]).toArray();
            res.send(result);
        });

        app.get('/package/:id', async (req, res) => {
            const id = req.params.id;
            const result = await packagesCollection.findOne({ _id: new ObjectId(id) });
            res.send(result);
        });

        app.post('/package', async (req, res) => {
            const package = req.body;
            const result = await packagesCollection.insertOne(package);
            res.send(result);
        });

        app.patch('/package/:id', async (req, res) => {
            const id = req.params.id;
            const updateData = req.body;
            const result = await packagesCollection.updateOne(
                { _id: new ObjectId(id) },
                { $set: updateData }
            );
            res.send(result);
        });

        app.delete('/package/:id', async (req, res) => {
            const id = req.params.id;
            const result = await packagesCollection.deleteOne({ _id: new ObjectId(id) });
            res.send(result);
        });

        // Booking Routes
        app.get('/booking', async (req, res) => {
            const result = await bookingsCollection.find().toArray();
            res.send(result);
        });

        app.get('/booking/user/:email', async (req, res) => {
            const email = req.params.email;
            const result = await bookingsCollection.find({ userEmail: email }).toArray();
            res.send(result);
        });

        app.get('/booking/guide/:email', async (req, res) => {
            const email = req.params.email;
            const result = await bookingsCollection.find({ guideEmail: email }).toArray();
            res.send(result);
        });

        app.post('/booking', async (req, res) => {
            const booking = req.body;
            const result = await bookingsCollection.insertOne(booking);
            res.send(result);
        });

        app.patch('/booking/:id', async (req, res) => {
            const id = req.params.id;
            const updateData = req.body;
            const result = await bookingsCollection.updateOne(
                { _id: new ObjectId(id) },
                { $set: updateData }
            );
            res.send(result);
        });

        app.delete('/booking/:id', async (req, res) => {
            const id = req.params.id;
            const result = await bookingsCollection.deleteOne({ _id: new ObjectId(id) });
            res.send(result);
        });

        // Tour Guide Routes
        app.get('/guide', async (req, res) => {
            const result = await guidesCollection.find().toArray();
            res.send(result);
        });

        app.get('/guide/random', async (req, res) => {
            const result = await guidesCollection.aggregate([
                { $sample: { size: 4 } }
            ]).toArray();
            res.send(result);
        });

        app.get('/guide/:email', async (req, res) => {
            const email = req.params.email;
            const result = await guidesCollection.findOne({ email });
            res.send(result);
        });

        app.post('/guide', async (req, res) => {
            const guide = req.body;
            const result = await guidesCollection.insertOne(guide);
            res.send(result);
        });

        app.patch('/guide/:email', async (req, res) => {
            const email = req.params.email;
            const updateData = req.body;
            const result = await guidesCollection.updateOne(
                { email },
                { $set: updateData }
            );
            res.send(result);
        });

        app.delete('/guide/:id', async (req, res) => {
            const id = req.params.id;
            const result = await guidesCollection.deleteOne({ _id: new ObjectId(id) });
            res.send(result);
        });

        // Story Routes
        app.get('/story', async (req, res) => {
            const result = await storiesCollection.find().toArray();
            res.send(result);
        });

        app.get('/story/user/:email', async (req, res) => {
            const email = req.params.email;
            const result = await storiesCollection.find({ authorEmail: email }).toArray();
            res.send(result);
        });

        app.post('/story', async (req, res) => {
            const story = req.body;
            const result = await storiesCollection.insertOne(story);
            res.send(result);
        });

        app.patch('/story/:id', async (req, res) => {
            const id = req.params.id;
            const updateData = req.body;
            const result = await storiesCollection.updateOne(
                { _id: new ObjectId(id) },
                { $set: updateData }
            );
            res.send(result);
        });

        app.delete('/story/:id', async (req, res) => {
            const id = req.params.id;
            const result = await storiesCollection.deleteOne({ _id: new ObjectId(id) });
            res.send(result);
        });

        // Payment Routes
        app.get('/payment', async (req, res) => {
            const result = await paymentsCollection.find().toArray();
            res.send(result);
        });

        app.post('/payment', async (req, res) => {
            const payment = req.body;
            const result = await paymentsCollection.insertOne(payment);
            res.send(result);
        });

        app.post('/payment/intent', async (req, res) => {
            // Stripe payment intent implementation would go here
            res.send({ clientSecret: 'test_client_secret' });
        });

        // Admin Analytics Routes
        app.get('/analytics', async (req, res) => {
            const usersCount = await usersCollection.countDocuments();
            const packagesCount = await packagesCollection.countDocuments();
            const guidesCount = await guidesCollection.countDocuments();
            const bookingsCount = await bookingsCollection.countDocuments();
            
            res.send({
                users: usersCount,
                packages: packagesCount,
                guides: guidesCount,
                bookings: bookingsCount
            });
        });

        app.get('/analytics/chart', async (req, res) => {
            const result = await bookingsCollection.aggregate([
                { $group: { _id: "$tourDate", count: { $sum: 1 } } },
                { $sort: { _id: 1 } }
            ]).toArray();
            res.send(result);
        });

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
