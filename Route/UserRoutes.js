const express = require("express");
const router = express.Router();
//Insert model
const User = require("../Model/UserModel");
//insert user controller
const userController = require("../Controllers/UserController");

router.get("/",userController.getAllUsers);
router.post("/",userController.uploadPhoto, userController.addUser);
router.get("/:id",userController.getById);
router.put("/:id", userController.uploadPhoto, userController.updateUser);
router.delete("/:id",userController.deleteUser);

//export
module.exports = router;