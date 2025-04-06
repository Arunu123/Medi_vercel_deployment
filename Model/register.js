const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const registerSchema = new Schema({
    name: {
        type: String,//dataType
        required: true,//validate
    },
    gmail: {
        type: String,//dataType
        required: true,//validate
    },
    password: {
        type: String,  // Changed from Number to String
        required: true,//validate
    },
    

});

module.exports = mongoose.model(
    "Register",//filename
    registerSchema//function name
)