const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { MongoClient, ObjectId, ServerApiVersion } = require("mongodb");
require("dotenv").config();
const crypto = require('crypto');
const cookieParser = require('cookie-parser');

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

// Utility function to generate JWT
const generateToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "1h", // Or any other duration
    });
};

// Middleware for authentication
const authenticateJWT = (req, res, next) => {
    const token = req.cookies.jwt;

    if (!token) {
        return res.sendStatus(401);
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.error("JWT Verification Error:", err);  // Log the error
            return res.sendStatus(403);
        }

        req.user = user;
        next();
    });
};

// AUTH ROUTES
// Register
app.post("/auth/register", async (req, res) => {
    const { username, password, email } = req.body;

    try {
        const existingUser = await UsersC.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = { username, password: hashedPassword, email, role: 'user' };
        const result = await UsersC.insertOne(newUser);

        const token = generateToken({ id: result.insertedId, role: 'user' });

        res.cookie('jwt', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            maxAge: 3600000,
        });

        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ message: "Failed to register user", error: error.message });
    }
});

// Login
app.post("/auth/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await UsersC.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const token = generateToken({ id: user._id, role: user.role });

        res.cookie('jwt', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            maxAge: 3600000,
        });

        res.json({ message: "Logged in successfully" });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Failed to login", error: error.message });
    }
});

// Logout
app.post("/auth/logout", (req, res) => {
    res.clearCookie('jwt', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict',
    });
    res.json({ message: "Logged out successfully" });
});

// Forgot Password (Implementation requires email sending and reset token generation)
app.post("/auth/forgot-password", async (req, res) => {
    const { email } = req.body;

    try {
        const user = await UsersC.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Generate a reset token and save it to the user document
        const resetToken = crypto.randomBytes(20).toString('hex');
        const passwordResetExpires = Date.now() + 3600000; // 1 hour

        await UsersC.updateOne(
            { _id: user._id },
            { $set: { resetToken, passwordResetExpires } }
        );

        // TODO: Send an email with the reset token link to the user's email address

        res.json({ message: "Password reset email sent" });
    } catch (error) {
        console.error("Forgot password error:", error);
        res.status(500).json({ message: "Failed to process forgot password request", error: error.message });
    }
});


// Reset Password
app.post("/auth/reset-password", async (req, res) => {
    const { resetToken, newPassword } = req.body;

    try {
        const user = await UsersC.findOne({
            resetToken: resetToken,
            passwordResetExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired reset token" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await UsersC.updateOne(
            { _id: user._id },
            { $set: { password: hashedPassword, resetToken: null, passwordResetExpires: null } }
        );

        res.json({ message: "Password reset successfully" });
    } catch (error) {
        console.error("Reset password error:", error);
        res.status(500).json({ message: "Failed to reset password", error: error.message });
    }
});


// USERS ROUTES
// Get all users (Admin only, add authentication check)
app.get("/users", async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Unauthorized" });
    }

    try {
        const users = await UsersC.find().toArray();
        res.json(users);
    } catch (error) {
        console.error("Get users error:", error);
        res.status(500).json({ message: "Failed to fetch users", error: error.message });
    }
});

// Get user by ID (Admin only, add authentication check)
app.get("/users/:id",  async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Unauthorized" });
    }

    const { id } = req.params;
    if (!ObjectId.isValid(id))
        return res.status(400).json({ message: "Invalid User ID" });

    try {
        const user = await UsersC.findOne({ _id: new ObjectId(id) });
        if (!user)
            return res.status(404).json({ message: "User not found" });
        res.json(user);
    } catch (error) {
        console.error("Fetch error:", error);
        res
            .status(500)
            .json({ message: "Failed to fetch User", error: error.message });
    }
});

// Get current user's profile (requires authentication)
app.get("/users/me",  async (req, res) => {
    try {
        const user = await UsersC.findOne({ _id: new ObjectId(req.user.id) });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json(user);
    } catch (error) {
        console.error("Get current user error:", error);
        res.status(500).json({ message: "Failed to fetch user profile", error: error.message });
    }
});

// PACKAGES ROUTES
// Get all packages
app.get("/packages", async (req, res) => {
    try {
        const packages = await PackagesC.find().toArray();
        res.json(packages);
    } catch (error) {
        console.error("Fetch packages error:", error);
        res.status(500).json({ message: "Failed to fetch packages", error: error.message });
    }
});

// Get a random set of packages
app.get("/packages/random", async (req, res) => {
    try {
        const packages = await PackagesC.aggregate([{ $sample: { size: 3 } }]).toArray();
        res.json(packages);
    } catch (error) {
        console.error("Fetch random packages error:", error);
        res.status(500).json({ message: "Failed to fetch random packages", error: error.message });
    }
});

// Get package by ID
app.get("/packages/:id", async (req, res) => {
    const { id } = req.params;
    if (!ObjectId.isValid(id))
        return res.status(400).json({ message: "Invalid Package ID" });

    try {
        const package = await PackagesC.findOne({ _id: new ObjectId(id) });
        if (!package)
            return res.status(404).json({ message: "Package not found" });
        res.json(package);
    } catch (error) {
        console.error("Fetch package error:", error);
        res.status(500).json({ message: "Failed to fetch package", error: error.message });
    }
});

// BOOKINGS ROUTES
// Get all bookings (requires authentication, admin only)
app.get("/bookings",  async (req, res) => {
    // if (req.user.role !== 'admin') {
        // return res.status(403).json({ message: "Unauthorized" });
    // }

    try {
        const bookings = await BookingsC.find().toArray();
        res.json(bookings);
    } catch (error) {
        console.error("Fetch bookings error:", error);
        res.status(500).json({ message: "Failed to fetch bookings", error: error.message });
    }
});

// Get all assigned bookings (requires authentication, guide only)
app.get("/bookings/assigned",  async (req, res) => {
    // Assumes that the booking documents have a guideId field
    try {
        const guideId = req.user.id; // Assuming the user ID is the guide ID
        const bookings = await BookingsC.find({ guideId: guideId }).toArray();
        res.json(bookings);
    } catch (error) {
        console.error("Fetch assigned bookings error:", error);
        res.status(500).json({ message: "Failed to fetch assigned bookings", error: error.message });
    }
});

// Get booking by ID
app.get("/bookings/:id",  async (req, res) => {
    const { id } = req.params;
    if (!ObjectId.isValid(id))
        return res.status(400).json({ message: "Invalid Booking ID" });

    try {
        const booking = await BookingsC.findOne({ _id: new ObjectId(id) });
        if (!booking)
            return res.status(404).json({ message: "Booking not found" });

        // Add role-based access control if needed (e.g., check if user owns the booking or is admin)
        res.json(booking);
    } catch (error) {
        console.error("Fetch booking error:", error);
        res.status(500).json({ message: "Failed to fetch booking", error: error.message });
    }
});
app.post('/bookings/', async (req, res) => {
  try {
    const bookingData = req.body;
    console.log('Booking data received:', bookingData);


    // Create new booking document
    const bookingDocument = {
      date: new Date(bookingData.date),
      service: bookingData.service,
      status: bookingData.status || 'pending', // Default status
      createdAt: new Date(),
      // Add any other relevant fields
      ...bookingData // Spread remaining fields
    };

    // Insert into MongoDB
    const result = await BookingsC.insertOne(bookingDocument);

    // Create response object with the inserted ID
    const newBooking = {
      _id: result.insertedId,
      ...bookingDocument
    };

    // Optional: Role-based access control
    // if (req.user.role !== 'admin' && req.user.id !== bookingData.userId) {
    //   return res.status(403).json({ 
    //     message: "Unauthorized: You can only create bookings for yourself" 
    //   });
    // }

    res.status(201).json({
      success: true,
      data: newBooking,
      message: "Booking created successfully"
    });
  } catch (error) {
    console.error("Create booking error:", error);
    res.status(500).json({ 
      success: false,
      message: `Failed to create booking: ${error.message}`,
      error: error.message 
    });
  }
});
// STORIES ROUTES
// Get all stories
app.get("/stories", async (req, res) => {
    try {
        const stories = await StoriesC.find().toArray();
        res.json(stories);
    } catch (error) {
        console.error("Fetch stories error:", error);
        res.status(500).json({ message: "Failed to fetch stories", error: error.message });
    }
});

// Get a random set of stories
app.get("/stories/random", async (req, res) => {
    try {
        const stories = await StoriesC.aggregate([{ $sample: { size: 4 } }]).toArray();
        res.json(stories);
    } catch (error) {
        console.error("Fetch random stories error:", error);
        res.status(500).json({ message: "Failed to fetch random stories", error: error.message });
    }
});

// Get stories by user (requires authentication)
app.get("/stories/user",  async (req, res) => {
    try {
        const userId = req.user.id;
        const stories = await StoriesC.find({ userId: userId }).toArray();
        res.json(stories);
    } catch (error) {
        console.error("Fetch user stories error:", error);
        res.status(500).json({ message: "Failed to fetch user stories", error: error.message });
    }
});

// Get story by ID
app.get("/stories/:id", async (req, res) => {
    const { id } = req.params;
    if (!ObjectId.isValid(id))
        return res.status(400).json({ message: "Invalid Story ID" });

    try {
        const story = await StoriesC.findOne({ _id: new ObjectId(id) });
        if (!story)
            return res.status(404).json({ message: "Story not found" });
        res.json(story);
    } catch (error) {
        console.error("Fetch story error:", error);
        res.status(500).json({ message: "Failed to fetch story", error: error.message });
    }
});

// GUIDES ROUTES
// Get a set of guides
app.get("/guides", async (req, res) => {
    try {
        const guides = await TourGuidesC.find().toArray();
        res.json(guides);
    } catch (error) {
        console.error("Fetch all guides error:", error);
        res.status(500).json({ message: "Failed to fetch guides", error: error.message });
    }
});
// Get a random set of guides
app.get("/guides/random", async (req, res) => {
  try {
      const guides = await TourGuidesC.aggregate([{ $sample: { size: 6 } }]).toArray();
      res.json(guides);
  } catch (error) {
      console.error("Fetch random guides error:", error);
      res.status(500).json({ message: "Failed to fetch random guides", error: error.message });
  }
});
// Get guide by ID
app.get("/guides/:id", async (req, res) => {
    const { id } = req.params;
    if (!ObjectId.isValid(id))
        return res.status(400).json({ message: "Invalid Guide ID" });

    try {
        const guide = await TourGuidesC.findOne({ _id: new ObjectId(id) });
        if (!guide)
            return res.status(404).json({ message: "Guide not found" });
        res.json(guide);
    } catch (error) {
        console.error("Fetch guide error:", error);
        res.status(500).json({ message: "Failed to fetch guide", error: error.message });
    }
});

// Apply to become a guide (requires authentication)
app.post("/guides/apply",  async (req, res) => {
    const applicationData = { ...req.body, userId: req.user.id };

    try {
        const result = await ApplicationsC.insertOne(applicationData);
        res.status(201).json({ message: "Application submitted successfully", applicationId: result.insertedId });
    } catch (error) {
        console.error("Application error:", error);
        res.status(500).json({ message: "Failed to submit application", error: error.message });
    }
});

// Get all guide applications (requires authentication, admin only)
app.get("/guides/applications",  async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Unauthorized" });
    }

    try {
        const applications = await ApplicationsC.find().toArray();
        res.json(applications);
    } catch (error) {
        console.error("Fetch applications error:", error);
        res.status(500).json({ message: "Failed to fetch applications", error: error.message });
    }
});

// Get guide application by ID (requires authentication, admin only)
app.get("/guides/applications/:id",  async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Unauthorized" });
    }

    const { id } = req.params;
    if (!ObjectId.isValid(id))
        return res.status(400).json({ message: "Invalid Application ID" });

    try {
        const application = await ApplicationsC.findOne({ _id: new ObjectId(id) });
        if (!application)
            return res.status(404).json({ message: "Application not found" });
        res.json(application);
    } catch (error) {
        console.error("Fetch application error:", error);
        res.status(500).json({ message: "Failed to fetch application", error: error.message });
    }
});

// PAYMENTS ROUTES (requires integration with a payment gateway like Stripe)
// Create payment intent (Stripe example)
app.post("/payments/intent", async (req, res) => {
    // This is a placeholder.
    res.status(500).json({ message: "Payment intent creation not implemented." });
});

// Record a payment transaction
app.post("/payments", async (req, res) => {
    // This is a placeholder.
    res.status(500).json({ message: "Payment recording not implemented." });
});

// Get payment statistics (requires authentication, admin only)
app.get("/payments/stats",  async (req, res) => {
    // Requires role admin
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Unauthorized" });
    }

    res.status(500).json({ message: "Payment statistics not implemented." });
});

// ADMIN ROUTES (requires authentication, admin only)
// Get admin statistics by year
app.get("/admin/stats/:year",  async (req, res) => {
     if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Unauthorized" });
    }
    const { year } = req.params;

    try {
        const adminStats = await AdminAnalyticsC.findOne({ year: year });

        if (!adminStats) {
            return res.status(404).json({ message: "Admin statistics not found" });
        }

        res.json(adminStats);
    } catch (error) {
        console.error("Fetch error:", error);
        res
            .status(500)
            .json({
                message: "Failed to fetch admin statistics",
                error: error.message,
            });
    }
});


app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
});