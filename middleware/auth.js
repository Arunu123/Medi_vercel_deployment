const jwt = require('jsonwebtoken');
const Hospital = require('../Model/hospital.model');
const Doctor = require('../Model/doctor.model');

const checkAuth = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        if (!authHeader) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Check if token contains hospitalId or doctorId
        if (decoded.hospitalId) {
            const hospital = await Hospital.findById(decoded.hospitalId);
            if (!hospital) {
                return res.status(401).json({ message: 'Hospital not found' });
            }
            req.hospital = hospital;
            req.userType = 'hospital';
        } else if (decoded.doctorId) {
            const doctor = await Doctor.findById(decoded.doctorId);
            if (!doctor) {
                return res.status(401).json({ message: 'Doctor not found' });
            }
            req.doctor = doctor;
            req.userType = 'doctor';
        } else {
            return res.status(401).json({ message: 'Invalid token' });
        }

        req.token = token;
        next();
    } catch (error) {
        console.error('Auth error:', error);
        res.status(401).json({ 
            message: 'Please authenticate',
            error: error.message 
        });
    }
};

const hospitalAuth = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        if (!authHeader) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const hospital = await Hospital.findById(decoded.hospitalId);
        if (!hospital) {
            return res.status(401).json({ message: 'Hospital not found' });
        }

        req.hospital = hospital;
        req.token = token;
        next();
    } catch (error) {
        console.error('Auth error:', error);
        res.status(401).json({ 
            message: 'Please authenticate',
            error: error.message 
        });
    }
};

const doctorAuth = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        if (!authHeader) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const doctor = await Doctor.findById(decoded.doctorId);
        if (!doctor) {
            return res.status(401).json({ message: 'Doctor not found' });
        }

        // Check if account is active
        if (doctor.status === 'Inactive') {
            return res.status(403).json({ 
                message: 'Your account has been deactivated. Please contact your hospital administrator.' 
            });
        }

        req.doctor = doctor;
        req.token = token;
        next();
    } catch (error) {
        console.error('Auth error:', error);
        res.status(401).json({ 
            message: 'Please authenticate',
            error: error.message 
        });
    }
};

module.exports = {
    checkAuth,
    hospitalAuth,
    doctorAuth
}; 