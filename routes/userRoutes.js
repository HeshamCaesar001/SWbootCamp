const express = require("express");
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
} = require("../controllers/userController");
const User = require("../models/User");
const router = express.Router();
const advancedResults = require("../middlewares/advancedResults");
const { protect, authorize } = require("../middlewares/auth");

router.use(protect);
router.use(authorize("admin"));

router.route("/").get(advancedResults(User), getUsers).post(createUser);
router.route("/:id").put(updateUser).delete(deleteUser).get(getUser);


module.exports = router