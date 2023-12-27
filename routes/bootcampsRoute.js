const express = require("express");
const {
  getBootCamps,
  getBootCamp,
  updateBootCamp,
  createBootCamp,
  deleteBootCamp,
  getBootcampsInRadius,
  bootcampUploadImage,
} = require("../controllers/bootcampController");
const { protect, authorize } = require("../middlewares/auth");
const Bootcamp = require("../models/Bootcamp");
// include other resource routers
const coursesRouter = require("./coursesRoute");
const reviewRouter = require("./reviewRoute");
const router = express.Router();
const advancedResults = require("../middlewares/advancedResults");
// Re-route into other resource router
router.use("/:bootcampId/courses", coursesRouter);
router.use("/:bootcampId/reviews", reviewRouter);

router
  .route("/")
  .get(advancedResults(Bootcamp, "courses"), getBootCamps)
  .post(protect, authorize("publisher", "admin"), createBootCamp);
router.route("/radius/:zipcode/:distance").get(getBootcampsInRadius);
router
  .route("/:id/image")
  .put(protect, authorize("publisher", "admin"), bootcampUploadImage);
router
  .route("/:id")
  .put(protect, authorize("publisher", "admin"), updateBootCamp)
  .delete(protect, authorize("publisher", "admin"), deleteBootCamp)
  .get(getBootCamp);
module.exports = router;
