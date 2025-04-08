require('dotenv').config();

//pass=1oteRYj4VanZFBDk


const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require('path');
const router = require("./Route/UserRoutes");
const hospitalRoutes = require('./Route/hospital.routes');
const doctorRoutes = require('./Route/doctor.routes');
const fs = require('fs-extra');

const app = express();

// Only create upload directories in development, not needed for serverless
if (process.env.NODE_ENV !== 'production') {
  // Ensure uploads directory exists
  const uploadsDir = path.join(__dirname, 'uploads');
  const doctorUploadsDir = path.join(__dirname, 'uploads/doctors');
  
  // Use ensureDirSync from fs-extra to create directories if they don't exist
  fs.ensureDirSync(uploadsDir);
  fs.ensureDirSync(doctorUploadsDir);
  
  // For local development, serve static files from uploads directory
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
}

const corsOptions = {
  origin: "*",
  methods: "GET,PUT,POST,DELETE,OPTIONS",
  allowedHeaders:
    "Content-Type, Authorization, Content-Length, X-Requested-With, x-access-token, x-access-id",
};

//Middleware connect
app.use(cors(corsOptions)); 
app.use(express.json());
app.use("/users",router);
app.use("/hospitals", hospitalRoutes);
app.use('/doctors', doctorRoutes);

// Set mongoose connection options
mongoose.set('strictQuery', false);

// Connect to MongoDB with proper serverless options
mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 5000, // Timeout after 5s
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
})
.then(() => console.log("Connected to MongoDB"))
.catch((err) => {
  console.error("MongoDB connection error:", err);
});

// In serverless environments, we don't need to explicitly listen on a port
// Vercel will handle that for us
// Only listen on a port in local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(process.env.PORT || 5000, () => {
    console.log(`Server is running on http://localhost:${process.env.PORT || 5000}`);
  });
}

// For Vercel serverless, export the app
module.exports = app;

//register-----------------------------------
// call register model
require("./Model/register");
const User = mongoose.model("Register");
app.post("/register", async (req, res) => {
    const { name, gmail, password } = req.body;
    try{
      await User.create({
        name,
        gmail,
        password
      });
      res.send({status:"Ok"});

    }catch(err){
      res.send({status:"err"});
    }
  }
);

//login-----------------------------------
app.post("/login", async (req, res) => {
  const { gmail, password } = req.body;
  try {
      console.log('Login attempt:', { gmail, password }); // Debug log
      
      const user = await User.findOne({ gmail });
      console.log('Found user:', user); // Debug log
      
      if (!user) {
          return res.json({ 
              success: false, 
              message: "Access denied. Please register first." 
          });
      }
      
      // Convert both passwords to strings for comparison
      const inputPassword = String(password);
      const storedPassword = String(user.password);
      
      console.log('Password comparison:', { 
          input: inputPassword, 
          stored: storedPassword,
          matches: inputPassword === storedPassword 
      }); // Debug log
      
      if (inputPassword === storedPassword) {
          return res.json({ 
              success: true, 
              message: "Login successful",
              user: {
                  name: user.name,
                  gmail: user.gmail
              }
          });
      } else {
          return res.json({ 
              success: false, 
              message: "Invalid credentials" 
          });
      }
  } catch (err) {
      console.error("Login error:", err);
      res.json({ 
          success: false, 
          message: "Authentication failed" 
      });
  }
});

// Add uncaught exception handler
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
  // Don't exit the process in serverless environment
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});

// Add unhandled rejection handler
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION:', err);
  // Don't exit the process in serverless environment
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});

// Root route handler - Add more diagnostic info
app.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'MediConnect API is running',
    environment: process.env.NODE_ENV || 'development',
    serverless: process.env.NODE_ENV === 'production' ? true : false
  });
});

// Add specific handling for 404 routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error details:', err);
    
    // Check if error is from multer
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
            success: false,
            message: 'File size too large, max 5MB allowed'
        });
    }
    
    // MongoDB errors
    if (err.name === 'MongoError' || err.name === 'MongoServerError') {
        return res.status(500).json({
            success: false,
            message: 'Database error occurred',
            error: err.message
        });
    }
    
    // Default error response
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Something went wrong!',
        stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
    });
});




