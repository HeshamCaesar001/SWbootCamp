const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmails");
const crypto = require("crypto");


//@description   Register a user
//@Route             POST api/v1/auth/register
//@access           public
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body;
  // create user
  const user = await User.create({ name, email, password, role });

  sendTokenResponse(user, 200, res);
});

//@description     Login a user
//@Route             POST api/v1/auth/login
//@access            public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  // validate email and password
  if (!email || !password) {
    return next(new ErrorResponse("please provide an email and password", 400));
  }

  // check for user
  const user = await User.findOne({ email }).select("+password");
  if (!user) next(new ErrorResponse("invalid credentials", 401));

  // check if password matches
  const is_match = await user.matchPassword(password);
  if (!is_match) {
    return next(new ErrorResponse("invalid credentials", 401));
  }
  sendTokenResponse(user, 200, res);
});

//@description     Log user out / clear cookies
//@Route             GET api/v1/auth/logout
//@access            Private
exports.logout = asyncHandler(async (req, res, next) => {
  res.cookie('token','none',{
    expires: new Date(Date.now()+10*1000),
    httpOnly: true
  })
  res.status(200).json({success:true,data:{}})
});

//@description     Get Current LoggedIn  user
//@Route             GET api/v1/auth/me
//@access            privet
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({ success: true, data: user });
});

//@description     Forgot password
//@Route             POST api/v1/auth/forgotpassword
//@access            Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new ErrorResponse("no user with that email", 404));
  }
  // get reset token
  const resetToken = user.getResetPasswordToken();

  await user.save({ validateBeforeSave: false });
  // create reset url
  const resetUrl = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/auth/resetpassword/${resetToken}`;
  const message = `You are receiving this email because you (or someone else) has requested the reset of a password.Please make  a PUT request to \n\n ${resetUrl}`;

  try {
    await sendEmail({
      email: user.email,
      subject: "please reset token",
      message,
    });
    res.status(200).json({ success: true, data: "Email sent" });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new ErrorResponse(`Email could not be send ->${error}`, 500));
  }
  res.status(200).json({ success: true, data: user });
});

//@description     reset password
//@Route             PUT api/v1/auth/resetpassword/:resettoken
//@access            public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  // get hashed token
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.resettoken)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ErrorResponse("invalid token", 400));
  }
  // Set new password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  try {
    await user.save();
  } catch (error) {
    console.log(error);
  }
  sendTokenResponse(user, 200, res);
});

//@description    Update user details[email,name]
//@Route             PUT api/v1/auth/updatedetails
//@access            privet
exports.updateDetails = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    name: req.body.name,
    email: req.body.email,
  };
  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({ success: true, data: user });
});

//@description    Update user password
//@Route             PUT api/v1/auth/updatepassword
//@access            privet
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password");
  // check current password is true
  if (!(await user.matchPassword(req.body.currentPassword))) {
    return next(new ErrorResponse("invalid password", 401));
  }
  user.password = req.body.newPassword;
  await user.save();
  sendTokenResponse(user, 200, res);
});

// get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // create token
  const token = user.getSignedJwtToken();
  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXP * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === "production") {
    options.secure = true;
  }
  res
    .status(statusCode)
    .cookie("token", token, options)
    .json({ success: true, token });
};
