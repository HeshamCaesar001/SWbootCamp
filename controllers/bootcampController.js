const path = require("path");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("express-async-handler");
const geocoder = require("../utils/geocoder");
const Bootcamp = require("../models/Bootcamp");
//@description   get all bootcamps
//@Route             GET api/v1/bootcamps
//@access           public
exports.getBootCamps = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});
//@description   get a bootcamp
//@Route             GET api/v1/bootcamps/:id
//@access           public

exports.getBootCamp = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findById(req.params.id).populate("courses");
  if (!bootcamp) next(error);

  res.status(200).json({ success: true, data: bootcamp });
});
//@description   create new bootcamp
//@Route             POST api/v1/bootcamps
//@access           Authenticated
exports.createBootCamp = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.user = req.user.id; // coming from middleware

  //check for published bootcamp for the loggedIn user
  const publishedBootcamp = await Bootcamp.findOne({ user: req.user.id });
  // if the user is not and admin, they can only add one bootcamp
  if (publishedBootcamp && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `the user with id ${req.user.id} has already published bootcamp`
      ),
      400
    );
  }
  const bootcamp = await Bootcamp.create(req.body);
  res.status(201).json({
    success: true,
    data: bootcamp,
  });
});
//@description   update a bootcamp
//@Route             PUT api/v1/bootcamps/:id
//@access           Authenticated
exports.updateBootCamp = asyncHandler(async (req, res, next) => {
  let bootcamp = await Bootcamp.findById(req.params.id);
  if (!bootcamp) next(error);
  // make sure user is the bootcamp owner
  if (bootcamp.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `this user with id ${req.user.id} not authorized to update this bootcamp`
      ),
      401
    );
  }
  bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ message: "done", data: bootcamp });
});
//@description   delete a bootcamp
//@Route             DELETE api/v1/bootcamps/:id
//@access           Authenticated
exports.deleteBootCamp = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findById({ _id: req.params.id });
  if (!bootcamp) next(new ErrorResponse(`Bootcamp not found`));
  // make sure user is the owner
  if (bootcamp.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `this user with id ${req.user.id} not authorized to delete this bootcamp`,
        401
      )
    );
  }
  await bootcamp.deleteOne();
  res.status(200).json({ message: "deleted" });
});
//@description   Get bootcamps within radius
//@Route             DELETE api/v1/bootcamps/radius/:zipcode/:distance
//@access           private
exports.getBootcampsInRadius = asyncHandler(async (req, res, next) => {
  const { zipcode, distance } = req.params;
  const loc = await geocoder.geocode(zipcode);
  const lat = loc[0].latitude;
  const lng = loc[0].longitude;
  // calc radius
  // Divide distance by the radius of Earth
  // Radius of  earth = 3,963 mi /6,378 km
  const radius = distance / 3963;
  const bootcamps = await Bootcamp.find({
    locations: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });
  res
    .status(200)
    .json({ success: true, count: bootcamps.length, data: bootcamps });
});
//@description   upload image for bootcamp
//@Route             put api/v1/bootcamps/:id/image
//@access           Authenticated
exports.bootcampUploadImage = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findById(req.params.id);
  if (!bootcamp) next(new ErrorResponse(`Bootcamp not found`, 400));
  // make sure user is the owner
  if (bootcamp.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `this user with id ${req.user.id} not authorized to update this bootcamp`,
        401
      )
    );
  }

  if (!req.files)
    next(new ErrorResponse(`Please upload a file for image`, 400));

  const file = req.files.file;
  // make sure that the file is a real image
  if (!file.mimetype.startsWith("image")) {
    next(new ErrorResponse(`Please upload an image file`, 400));
  }
  // check file size
  if (file.size > process.env.MAX_FILE_UPLOAD) {
    next(
      new ErrorResponse(
        `Please upload image with size less than ${process.env.MAX_FILE_UPLOAD}`,
        400
      )
    );
  }
  // create custom file name
  file.name = `image_${bootcamp._id}${path.parse(file.name).ext}`;

  // upload file
  file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async (err) => {
    if (err) {
      console.log(err);
      return next(new ErrorResponse(`Problem with file upload`, 500));
    }
    await Bootcamp.findByIdAndUpdate(req.params.id, { image: file });
    res.status(200).json({ success: true, data: file.name });
  });
});
