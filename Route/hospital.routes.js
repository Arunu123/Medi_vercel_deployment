const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Hospital = require('../Model/hospital.model');
const auth = require('../middleware/auth');
const hospitalController = require('../Controllers/HospitalController');

// Register a new hospital
router.post('/register', hospitalController.registerHospital);

// Get all hospitals
router.get('/', async (req, res) => {
    try {
        const hospitals = await Hospital.find().select('-password');
        res.json({
            success: true,
            hospitals
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching hospitals',
            error: error.message
        });
    }
});

// Get hospital profile
router.get('/profile', auth.hospitalAuth, async (req, res) => {
    try {
        const hospital = await Hospital.findById(req.hospital.id).select('-password');
        if (!hospital) {
            return res.status(404).json({ message: 'Hospital not found' });
        }
        res.json(hospital);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Update hospital profile
router.put('/profile', auth.hospitalAuth, async (req, res) => {
    try {
        const updates = req.body;
        delete updates.password; // Don't allow password updates through this route

        const hospital = await Hospital.findByIdAndUpdate(
            req.hospital.id,
            { $set: updates },
            { new: true, runValidators: true }
        ).select('-password');

        res.json(hospital);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Hospital login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log('Login attempt for:', email);

        // Find hospital by email
        const hospital = await Hospital.findOne({ email });
        if (!hospital) {
            console.log('No hospital found with email:', email);
            return res.status(400).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        console.log('Found hospital:', hospital.name);
        console.log('Stored hashed password:', hospital.password);
        console.log('Provided password:', password);

        // Verify password
        const isMatch = await bcrypt.compare(password, hospital.password);
        console.log('Password comparison result:', isMatch);

        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Create JWT token
        const token = jwt.sign(
            { hospitalId: hospital._id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        console.log('Login successful for hospital:', hospital.name);

        res.json({
            success: true,
            message: 'Login successful',
            token,
            hospital: {
                id: hospital._id,
                name: hospital.name,
                email: hospital.email
            }
        });

    } catch (error) {
        console.error('Login error details:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: error.message
        });
    }
});

// Validation route
router.post('/validate', hospitalController.validateField);

module.exports = router; 