const crypto = require("crypto");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");

const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

const sendEmail = require("../utils/email");

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createAndSendJWT = function (user, statusCode, res, sendUserData) {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    ...(process.env.NODE_ENV === "production" && { secure: true }),
    httpOnly: true,
  };

  res.cookie("jwt", token, cookieOptions);

  res.status(statusCode).json({
    status: "success",
    token,
    ...(sendUserData && { data: user }),
  });
};

exports.signup = catchAsync(async function (req, res) {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  createAndSendJWT(newUser, 201, res, true);
});

exports.login = catchAsync(async function (req, res, next) {
  const { email, password } = req.body;
  const invalidCredentialsError = new AppError(
    "Incorrect email or password",
    401,
  );

  // 1) Check if the request body contains an email and password:
  if (!email || !password)
    return next(new AppError("Please provide your email and password", 400));

  // 2) Check if the account exists && password is correct:
  const user = await User.findOne({ email }).select("+password");

  // userDoc.matchPasswords() method is implemented by us in the model:
  const passwordMatched = await user?.matchPasswords(password, user.password);
  if (!user || !passwordMatched) return next(invalidCredentialsError);

  // 3) If the credential are correct, send a JWT for login:
  createAndSendJWT(user, 200, res, false);
});

exports.logout = catchAsync(async function (req, res, next) {
  // Send a backend-induced response to instruct the client to clear the "jwt" cookie from the browser:
  res.clearCookie("jwt");

  res.status(200).json({ status: "success" });
});

exports.protect = catchAsync(async function (req, res, next) {
  // 1) Get the token and check if it exists:
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ").at(1);
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token)
    return next(
      new AppError("Please log in to access this route or resource", 401),
    );

  // 2) Token verification:
  // Since jwt.verify() is an async function, we can promisify it to use "await" on it. The promisified version of jwt.verify, returned by promisify(), then resolves to the decoded value (payload, iat, and exp) of the token when called:
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if the user still exists:
  // The user who requested the route will have his ID as the payload in the value decoded from the received JWT. If no user with that ID exists in the DB, it means that either the user was deleted, someone stole the user's JWT, or the payload of the received JWT was tampered with:
  const currentUser = await User.findById(decoded.id);
  if (!currentUser)
    return next(
      new AppError(
        "The user who this token belongs to does no longer exists",
        401,
      ),
    );

  // 4) Check if the user changed the password after the issuance of a JWT:
  // The User.changedPasswordAfter() method is implemented in the userModel file/module as an instance method on the User documents:
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError(
        "Your password was recently changed. Please log in again with your current password",
        401,
      ),
    );
  }

  // If all the above checks succeed, add the user data to the request and grant the user access to the protected route by forwarding the request to the next middleware:
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

// Middleware only for rendered views. Checks if a user is logged in or not, for conditional rendering. Cannot encounter errors so error handling not required:
exports.isLoggedIn = catchAsync(async function (req, res, next) {
  const token = req.cookies.jwt;

  if (token) {
    // 1) Verify the token:
    const decoded = await promisify(jwt.verify)(
      token,
      process.env.JWT_SECRET,
    ).catch(() => false);

    if (!decoded) return next();

    // 2) Check if the user still exists:
    // The user who requested the route will have his ID as the payload in the value decoded from the received JWT. If no user with that ID exists in the DB, it means that either the user was deleted, someone stole the user's JWT, or the payload of the received JWT was tampered with:
    const currentUser = await User.findById(decoded.id).catch(() => false);
    if (!currentUser) return next();

    // 3) Check if the user changed the password after the issuance of a JWT:
    // The User.changedPasswordAfter() method is implemented in the userModel file/module as an instance method on the User documents:
    if (currentUser.changedPasswordAfter(decoded.iat)) return next();

    // If all the above checks succeed, the user is logged in. Make the user accessible to the templates and conditionally render the views accordingly:
    res.locals.user = currentUser;
    res.locals.pathname = req.path;
    return next();
  }

  next();
});

exports.restrictTo = function (...roles) {
  return function (req, res, next) {
    // The "roles" array will contain the roles that we want to give access and rights to. The user's data was added to the req in the above "protect" middelware. So, we can read the user's role using that data. 403 status code means "forbidden":
    if (!roles.includes(req.user.role))
      return next(
        new AppError(
          "Unauthorized access! You don't have permission to perform this action.",
          403,
        ),
      );

    // If the user's role has the permission, advance to the next middleware:
    next();
  };
};

exports.forgotPassword = catchAsync(async function (req, res, next) {
  // 1) Get the user based on the POSTed email:
  const user = await User.findOne({ email: req.body.email });

  if (!user)
    return next(
      new AppError(
        "No such user found. Make sure you enetered the correct email address",
      ),
      404,
    );

  // 2) Generate a random reset token:
  const resetToken = user.createPasswordResetToken();
  // Save the document after creating the reset token and populating the corresponding fields:
  await user.save({ validateModifiedOnly: true });

  // 3) Send the token as an email:
  // req.protocol reads the protocol, and req.get("host") reads the domain name of the endpoint the request was sent to.
  const resetURL = `${req.protocol}://${req.get("host")}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't request a password reset, please ignore this email!`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Your password reset token (valid for 10 minutes)",
      message,
    });

    res.status(200).json({
      status: "success",
      message: "Password reset token sent to user",
    });
  } catch (err) {
    user.createPasswordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateModifiedOnly: true });

    return next(
      new AppError(
        "An error occurred while sending the email. Try again later!",
        500,
      ),
    );
  }
});

exports.resetPassword = catchAsync(async function (req, res, next) {
  // 1) Get the user from the DB using the token:
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  // Find the user from the DB and check if the token hasn't expired:
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2) If the user exists and the token hasn't expired, set the new password:
  if (!user) return next(new AppError("Token is invalid or has expired", 400));

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3) Update the user's changedPasswordAt field and save the MongoDB user document:
  // A pre-save middleware that updates changedPasswordAt only when the password field is modified takes care of this BTS.

  // 4) Log the user in by sending a new JWT:
  createAndSendJWT(user, 201, res, true);
});

exports.updatePassword = catchAsync(async function (req, res, next) {
  // 1) Get the user from the collection:
  const user = await User.findById(req.user.id).select("+password");

  // 2) Check if the current password POSTed by the user is correct:
  const passwordMatches = await user.matchPasswords(
    req.body.passwordCurrent,
    user.password,
  );

  if (!passwordMatches)
    return next(
      new AppError(
        "Incorrect password! Please enter your current password",
        400,
      ),
    );

  // 3) If yes, update the user document with the new password:
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  // User.findByIdAndUpdate will NOT work as expected.
  await user.save();

  // 4) Log the user in again by sending a new JWT:
  createAndSendJWT(user, 200, res, false);
});
