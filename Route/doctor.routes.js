const express = require('express');
const router = express.Router();
const doctorController = require('../Controllers/DoctorController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

// Hospital routes (requires hospital auth)
router.post('/register', 
    auth.hospitalAuth,
    upload.single('photo'),  // Handle single file upload with field name 'photo'
    doctorController.registerDoctor
);
router.get('/hospital-doctors', auth.hospitalAuth, doctorController.getHospitalDoctors);

// Doctor routes
router.post('/login', doctorController.loginDoctor);
router.get('/profile', auth.doctorAuth, doctorController.getDoctorProfile);

// Add these new routes
router.put('/:id', 
    auth.hospitalAuth,
    upload.single('photo'),
    doctorController.updateDoctor
);

router.patch('/:id/status',
    auth.hospitalAuth,
    doctorController.updateDoctorStatus
);

// Add this new route
router.put('/profile/update',
    auth.doctorAuth,
    upload.single('photo'),
    doctorController.updateDoctorProfile
);

// Add this new route for patient lookup
router.get('/patient-lookup/:idType/:idNumber', 
    auth.doctorAuth,
    doctorController.lookupPatient
);

module.exports = router; 