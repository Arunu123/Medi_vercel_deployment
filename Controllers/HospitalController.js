const Hospital = require('../Model/hospital.model');
const bcrypt = require('bcryptjs');

// Add this new validation endpoint
const validateField = async (req, res) => {
    const { field, value } = req.body;
    
    try {
        let existingHospital;
        
        // Skip validation if value is empty
        if (!value || value.trim() === '') {
            return res.json({ isValid: true });
        }

        switch (field) {
            case 'name':
                existingHospital = await Hospital.findOne({ name: value });
                break;
                
            case 'email':
                existingHospital = await Hospital.findOne({ email: value });
                break;
                
            case 'phone':
                existingHospital = await Hospital.findOne({ contactNumber: value });
                break;
                
            case 'registrationNumber':
                existingHospital = await Hospital.findOne({ registrationNumber: value });
                break;
                
            default:
                return res.json({ isValid: true });
        }
        
        if (existingHospital) {
            return res.json({ 
                isValid: false, 
                message: `This ${field} is already registered` 
            });
        }
        
        return res.json({ isValid: true });
        
    } catch (error) {
        console.error('Validation error:', error);
        return res.json({ isValid: true }); // Default to valid on error
    }
};

// Register hospital
const registerHospital = async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            address,
            phone,
            registrationNumber,
        } = req.body;

        console.log('Registering new hospital:', name);
        console.log('Original password:', password);

        // Check if hospital already exists
        const existingHospital = await Hospital.findOne({
            $or: [
                { email },
                { contactNumber: phone },
                { registrationNumber }
            ]
        });

        if (existingHospital) {
            return res.status(400).json({
                success: false,
                message: 'Hospital already exists with these details'
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        console.log('Hashed password:', hashedPassword);

        // Create new hospital
        const hospital = new Hospital({
            name,
            email,
            password: hashedPassword,
            address,
            contactNumber: phone,
            registrationNumber,
            district: 'Default District',
            status: 'Active'
        });

        const savedHospital = await hospital.save();
        console.log('Hospital registered with hashed password:', {
            name: savedHospital.name,
            email: savedHospital.email,
            hashedPassword: savedHospital.password
        });

        res.status(201).json({
            success: true,
            message: 'Hospital registered successfully',
            hospitalId: savedHospital._id
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed: ' + error.message
        });
    }
};

module.exports = {
    validateField,
    registerHospital
}; 