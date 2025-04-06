require('dotenv').config();

//pass=1oteRYj4VanZFBDk


const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require('path');
const router = require("./Route/UserRoutes");
const hospitalRoutes = require('./Route/hospital.routes');
const doctorRoutes = require('./Route/doctor.routes');
const multer = require('multer');

const app = express();


//Middleware connect
app.use(cors()); 
app.use(express.json());
app.use("/users",router);
app.use("/hospitals", hospitalRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/doctors', doctorRoutes);

// Make sure multer is properly configured
const upload = multer({
    dest: 'uploads/doctors/',
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});


mongoose.connect(process.env.MONGODB_URI)
.then(()=> console.log("connected to MongoDB"))
.then(() => {
    app.listen(process.env.PORT || 5000, () => {
      console.log(`Server is running on http://localhost:${process.env.PORT || 5000}`);
    });
})
.catch((err)=> console.log((err)));


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

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: err.message || 'Something went wrong!'
    });
});




