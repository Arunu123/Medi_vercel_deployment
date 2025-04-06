const Doctor = require('../Model/doctor.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../Model/UserModel');

// Register new doctor (only accessible by hospital)
const registerDoctor = async (req, res) => {
    try {
        console.log('Registering doctor with data:', req.body);
        console.log('File received:', req.file);

        const {
            name,
            email,
            password,
            specialization,
            qualification,
            experience,
            phone
        } = req.body;

        // Validate required fields
        if (!name || !email || !password || !specialization || !qualification || !experience || !phone) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Check if doctor already exists
        const existingDoctor = await Doctor.findOne({ email });
        if (existingDoctor) {
            return res.status(400).json({
                success: false,
                message: 'Doctor with this email already exists'
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Prepare photo path if file was uploaded
        let photoPath = undefined;
        let photoData = undefined;
        
        if (req.file) {
            // For serverless environment
            if (process.env.NODE_ENV === 'production') {
                // Store file data directly in MongoDB (as base64)
                photoData = req.file.buffer ? req.file.buffer.toString('base64') : undefined;
                photoPath = 'data:image/jpeg;base64,PHOTO_DATA'; // Placeholder, data will be served dynamically
            } else {
                // For local environment
                photoPath = `uploads/doctors/${req.file.filename}`;
            }
        }

        // Create new doctor
        const doctor = new Doctor({
            name,
            email,
            password: hashedPassword,
            specialization,
            qualification,
            experience: Number(experience),
            phone,
            hospitalId: req.hospital.id,
            photo: photoPath,
            photoData: photoData // Add this field to your Doctor model
        });

        await doctor.save();
        console.log('Doctor saved successfully:', doctor);

        res.status(201).json({
            success: true,
            message: 'Doctor registered successfully',
            doctor: {
                id: doctor._id,
                name: doctor.name,
                email: doctor.email,
                photo: doctor.photo
            }
        });

    } catch (error) {
        console.error('Doctor registration error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to register doctor'
        });
    }
};

// Doctor login
const loginDoctor = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find doctor
        const doctor = await Doctor.findOne({ email })
            .populate('hospitalId', 'name');
            
        if (!doctor) {
            return res.status(400).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if account is active
        if (doctor.status === 'Inactive') {
            return res.status(403).json({
                success: false,
                message: 'Your account has been deactivated. Please contact your hospital administrator.'
            });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, doctor.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Create token
        const token = jwt.sign(
            { doctorId: doctor._id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            token,
            doctor: {
                id: doctor._id,
                name: doctor.name,
                email: doctor.email,
                specialization: doctor.specialization,
                photo: doctor.photo,
                hospitalName: doctor.hospitalId?.name,
                status: doctor.status
            }
        });

    } catch (error) {
        console.error('Doctor login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed'
        });
    }
};

// Get hospital's doctors (for hospital dashboard)
const getHospitalDoctors = async (req, res) => {
    try {
        // Remove the status filter to get all doctors
        const doctors = await Doctor.find({ 
            hospitalId: req.hospital.id
        }).select('-password');

        res.json({
            success: true,
            doctors
        });

    } catch (error) {
        console.error('Error fetching doctors:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch doctors'
        });
    }
};

// Get doctor profile
const getDoctorProfile = async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.doctor.id)
            .select('-password')
            .populate('hospitalId', 'name');

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: 'Doctor not found'
            });
        }

        res.json({
            success: true,
            doctor
        });

    } catch (error) {
        console.error('Error fetching doctor profile:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch profile'
        });
    }
};

const updateDoctor = async (req, res) => {
    try {
        const updates = { ...req.body };
        
        if (req.file) {
            updates.photo = `uploads/doctors/${req.file.filename}`;
        }

        const doctor = await Doctor.findOneAndUpdate(
            { 
                _id: req.params.id,
                hospitalId: req.hospital.id 
            },
            updates,
            { new: true }
        );

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: 'Doctor not found or not authorized'
            });
        }

        res.json({
            success: true,
            message: 'Doctor updated successfully',
            doctor
        });

    } catch (error) {
        console.error('Update error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update doctor'
        });
    }
};

const updateDoctorStatus = async (req, res) => {
    try {
        const { status } = req.body;
        
        if (!['Active', 'Inactive'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status value'
            });
        }

        const doctor = await Doctor.findOneAndUpdate(
            { 
                _id: req.params.id,
                hospitalId: req.hospital.id 
            },
            { status },
            { new: true }
        );

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: 'Doctor not found or not authorized'
            });
        }

        res.json({
            success: true,
            message: 'Status updated successfully',
            doctor
        });

    } catch (error) {
        console.error('Status update error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update status'
        });
    }
};

const updateDoctorProfile = async (req, res) => {
    try {
        const updates = { ...req.body };
        
        if (req.file) {
            updates.photo = `uploads/doctors/${req.file.filename}`;
        }

        const doctor = await Doctor.findByIdAndUpdate(
            req.doctor.id,
            updates,
            { new: true }
        ).select('-password');

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: 'Doctor not found'
            });
        }

        res.json({
            success: true,
            message: 'Profile updated successfully',
            doctor
        });

    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update profile'
        });
    }
};

const lookupPatient = async (req, res) => {
    try {
        const { idType, idNumber } = req.params;

        // Validate ID type
        if (!['NIC', 'Passport', 'DrivingLicense'].includes(idType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid ID type'
            });
        }

        // Find patient by ID
        const patient = await User.findOne({
            governmentIdType: idType,
            governmentIdNumber: idNumber
        });

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found'
            });
        }

        res.json({
            success: true,
            patient
        });

    } catch (error) {
        console.error('Patient lookup error:', error);
        res.status(500).json({
            success: false,
            message: 'Error looking up patient'
        });
    }
};

module.exports = {
    registerDoctor,
    loginDoctor,
    getHospitalDoctors,
    getDoctorProfile,
    updateDoctor,
    updateDoctorStatus,
    updateDoctorProfile,
    lookupPatient
}; 