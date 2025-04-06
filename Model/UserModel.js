const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    // Personal Information
    name: {
        type: String,
        required: true
    },
    dateOfBirth: {
        type: Date,
        required: true
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other'],
        required: true
    },
    phoneNumber: {
        type: String,
        required: true
    },
    gmail: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    permanentAddress: {
        type: String,
        required: true
    },
    temporaryAddress: String,

    // Identification Details
    governmentIdType: {
        type: String,
        enum: ['NIC', 'Passport', 'DrivingLicense'],
        required: true
    },
    governmentIdNumber: {
        type: String,
        required: true
    },
    nationalHealthId: String,

    // Medical History
    allergies: String,
    chronicConditions: String,
    pastSurgeries: String,
    currentMedications: String,
    familyMedicalHistory: String,

    // Emergency Contact
    emergencyContactName: {
        type: String,
        required: true
    },
    emergencyContactRelationship: {
        type: String,
        required: true
    },
    emergencyContactPhone: {
        type: String,
        required: true
    },

    // Insurance Information
    insuranceProvider: String,
    policyNumber: String,
    validityDate: {
        type: Date,
        required: false
    },

    // Additional Information
    bloodGroup: {
        type: String,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    },
    occupation: String,
    maritalStatus: {
        type: String,
        enum: ['Single', 'Married', 'Divorced']
    },
    preferredLanguage: String,

    // Add photo field
    photo: {
        type: String, // This will store the photo URL/path
    },

    // Metadata
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt timestamp before saving
userSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    
    // Hash password before saving if modified
    if (this.isModified('password')) {
        const salt = bcrypt.genSaltSync(10);
        this.password = bcrypt.hashSync(this.password, salt);
    }
    
    next();
});

// Method to check if password is correct
userSchema.methods.comparePassword = function(candidatePassword) {
    return bcrypt.compareSync(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);