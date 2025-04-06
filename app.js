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

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
const doctorUploadsDir = path.join(__dirname, 'uploads/doctors');

// Use ensureDirSync from fs-extra to create directories if they don't exist
fs.ensureDirSync(uploadsDir);
fs.ensureDirSync(doctorUploadsDir);

//Middleware connect
app.use(cors()); 
app.use(express.json());
app.use("/users",router);
app.use("/hospitals", hospitalRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/doctors', doctorRoutes);

mongoose.connect(process.env.MONGODB_URI)
.then(()=> console.log("connected to MongoDB"))
.then(() => {
    app.listen(process.env.PORT || 5000, () => {
      console.log(`Server is running on http://localhost:${process.env.PORT || 5000}`);
    });
})
.catch((err)=> {
    console.error("MongoDB connection error:", err);
    process.exit(1);
});


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

// Add root route handler to check server status
app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'MediConnect API is running' });
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




