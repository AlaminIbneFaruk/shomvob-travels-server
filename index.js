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

let collection;

async function connectDB() {
  try {
    await client.connect();
    console.log("Connected to MongoDB!");
    const database = client.db("ShomvobTravels");
    collection = database.collection("packages");
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  }
}

// Call the function to connect to DB
connectDB();

app.get("/", (req, res) => res.send("Hello World!"));

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
