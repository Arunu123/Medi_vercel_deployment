const UserModel = require('../Model/UserModel');
const multer = require('multer');
const path = require('path');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/') // Make sure this directory exists
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname))
  }
});

const upload = multer({ storage: storage });

//data display part

const getAllUsers = async (req, res , next) => {
   
    let users;
 // Get all users
    try {
        users = await UserModel.find();
    } catch (err) {
        console.log(err);
        
    }
 
    //not found users
    if(!users){
        return res.status(404).json({message:"User not found"})

    }
    //display all users
    return res.status(200).json({users})

};

//data insert part

const addUser = async (req, res) => {
    try {
        const userData = req.body;
        
        // Check for existing email
        const existingEmail = await UserModel.findOne({ gmail: userData.gmail });
        if (existingEmail) {
            return res.status(400).json({ 
                message: "Email address already registered",
                field: "gmail"
            });
        }

        // Check for existing phone number
        const existingPhone = await UserModel.findOne({ phoneNumber: userData.phoneNumber });
        if (existingPhone) {
            return res.status(400).json({ 
                message: "Phone number already registered",
                field: "phoneNumber"
            });
        }

        // Check for existing government ID
        const existingId = await UserModel.findOne({
            governmentIdType: userData.governmentIdType,
            governmentIdNumber: userData.governmentIdNumber
        });
        if (existingId) {
            return res.status(400).json({
                message: `This ${userData.governmentIdType} number is already registered`,
                field: "governmentIdNumber"
            });
        }

        // Validate password
        if (!userData.password) {
            return res.status(400).json({
                message: "Password is required",
                field: "password"
            });
        }

        // Password validation regex pattern
        const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordPattern.test(userData.password)) {
            return res.status(400).json({
                message: "Password must be at least 8 characters and include uppercase, lowercase, number, and special character",
                field: "password"
            });
        }

        // Add photo path if a file was uploaded
        if (req.file) {
            userData.photo = `/uploads/${req.file.filename}`;
        }

        const user = new UserModel(userData);
        await user.save();
        return res.status(201).json({ user });
    } catch (error) {
        console.log(error);
        return res.status(400).json({ message: error.message });
    }
};

//Get by Id
const getById = async (req, res,next) => {

    const id = req.params.id;

    let user;

    try{
      user = await UserModel.findById(id);
    }catch(err){
      console.log(err);
    }
    //not available users
    if(!user)    {
      return res.status(404).json({message:"user not found"});
    }
    return res.status(200).json({ user });
}

//Updates User details

const updateUser = async (req, res, next) => {
  const id = req.params.id;
  try {
    const userData = req.body;
    
    // Check for existing email, excluding current user
    const existingEmail = await UserModel.findOne({ 
        gmail: userData.gmail,
        _id: { $ne: id }
    });
    if (existingEmail) {
        return res.status(400).json({ 
            message: "Email address already registered",
            field: "gmail"
        });
    }

    // Check for existing phone, excluding current user
    const existingPhone = await UserModel.findOne({ 
        phoneNumber: userData.phoneNumber,
        _id: { $ne: id }
    });
    if (existingPhone) {
        return res.status(400).json({ 
            message: "Phone number already registered",
            field: "phoneNumber"
        });
    }

    // Check for existing government ID, excluding current user
    const existingId = await UserModel.findOne({
        governmentIdType: userData.governmentIdType,
        governmentIdNumber: userData.governmentIdNumber,
        _id: { $ne: id }
    });
    if (existingId) {
        return res.status(400).json({
            message: `This ${userData.governmentIdType} number is already registered`,
            field: "governmentIdNumber"
        });
    }
    
    // Validate password if it's being updated
    if (userData.password) {
        // Password validation regex pattern
        const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordPattern.test(userData.password)) {
            return res.status(400).json({
                message: "Password must be at least 8 characters and include uppercase, lowercase, number, and special character",
                field: "password"
            });
        }
    }
    
    // Handle date fields
    if (userData.validityDate === 'null' || userData.validityDate === '') {
      delete userData.validityDate;
    }
    
    if (userData.dateOfBirth) {
      userData.dateOfBirth = new Date(userData.dateOfBirth);
    }
    
    if (userData.validityDate) {
      userData.validityDate = new Date(userData.validityDate);
    }

    // Add photo path if a new file was uploaded
    if (req.file) {
      userData.photo = `/uploads/${req.file.filename}`;
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
      id,
      {
        ...userData,
        updatedAt: new Date()
      },
      { 
        new: true, 
        runValidators: true,
        omitUndefined: true // This will prevent setting undefined values
      }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ user: updatedUser });
  } catch (err) {
    console.error("Error updating user:", err);
    return res.status(400).json({ message: err.message });
  }
};

// Delete user detail with better error handling
const deleteUser = async (req, res, next) => {
  const id = req.params.id;

  try {
    const user = await UserModel.findById(id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await UserModel.findByIdAndDelete(id);
    return res.status(200).json({ message: "User successfully deleted", user });
  } catch (err) {
    console.error("Error deleting user:", err);
    return res.status(500).json({ message: "Error deleting user", error: err.message });
  }
};

// Add this to your exports
exports.uploadPhoto = upload.single('photo');

exports.getAllUsers = getAllUsers;
exports.addUser = addUser;
exports.getById = getById;
exports.updateUser = updateUser;
exports.deleteUser = deleteUser;

