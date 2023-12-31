const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("express-async-handler");
const Course = require("../models/Course");
const Bootcamp = require("../models/Bootcamp");
//@description   get all courses
//@Route             GET api/v1/courses
//@Route             GET api/v1/bootcamp/:bootcampId/courses
//@access           public
exports.getCourses = asyncHandler(async (req, res, next) => {
  if (req.params.bootcampId) {
    const courses = await Course.find({ bootcamp: req.params.bootcampId });
    return res.status(200).json({
      success: true,
      count: courses.length,
      data: courses,
    });
  } else {
    res.status(200).json(res.advancedResults);
  }
});
//@description   get single course
//@Route             GET api/v1/courses/:id
//@access           public
exports.getCourse = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id).populate({
    path: "bootcamp",
    select: "name description",
  });
  if (!course) next(new ErrorResponse(`Course not found`, 404));
  res.status(200).json({ success: true, data: course });
});
//@description   Add A  course
//@Route             Post api/v1/bootcamps/:bootcampId/courses/
//@access           Authenticated
exports.addCourse = asyncHandler(async (req, res, next) => {
  req.body.bootcamp = req.params.bootcampId;
  req.body.user = req.user.id;

  const bootcamp = await Bootcamp.findById(req.params.bootcampId);

  if (!bootcamp) {
    return next(
      new ErrorResponse(
        `Bootcamp not found with this id ${req.params.bootcampId}`,
        404
      )
    );
  }
  // make sure the loggedIn user is the owner of this bootcamp
  if (bootcamp.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `this user with id ${req.user.id} not authorized to add a course to bootcamp ${bootcamp._id}`,
        401
      )
    );
  }
  const course = await Course.create(req.body);
  res.status(200).json({ success: true, data: course });
});
//@description   Update A  course
//@Route             Put api/v1/courses/:id
//@access           Authenticated
exports.updateCourse = asyncHandler(async (req, res, next) => {
  let course = await Course.findById(req.params.id);

  if (!course) {
    return next(
      new ErrorResponse(`Course not found with this id ${req.params.id}`, 404)
    );
  }
  // make sure the loggedIn user is the owner of this course
  if (course.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        ` user with id ${req.user.id} is not authorized to update course ${course._id}`,
        401
      )
    );
  }
  course = await Course.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({ success: true, data: course });
});
//@description   Delete   course
//@Route             DELETE api/v1/courses/:id
//@access           Authenticated
exports.deleteCourse = asyncHandler(async (req, res, next) => {
  const course = await Course.findById({ _id: req.params.id });

  if (!course) {
    return next(
      new ErrorResponse(`Course not found with this id ${req.params.id}`, 404)
    );
  }
  // make sure the loggedIn user is the owner of this course
  if (course.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        ` user with id ${req.user.id} is not authorized to delete course ${course._id}`,
        401
      )
    );
  }
  await course.deleteOne();
  res
    .status(200)
    .json({ success: true, message: "Course deleted successfully" });
});
