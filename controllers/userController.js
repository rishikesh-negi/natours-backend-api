const multer = require("multer");
const sharp = require("sharp");

const User = require("../models/userModel");
const AppError = require("../utils/appError");
const { deleteOne, updateOne, getOne, getAll } = require("./handlerFactory");

const catchAsync = require("../utils/catchAsync");

const filterObj = function (obj, ...allowedFields) {
  const filteredObj = {};

  Object.keys(obj).forEach((key) => {
    if (allowedFields.includes(key)) filteredObj[key] = obj[key];
  });

  return filteredObj;
};

// Configuring Multer storage and filter for file uploads. The "cb" parameter in the functions below is a callback function somewhat similar to Express's "next" function:
// const multerStorage = multer.diskStorage({
//   destination(req, file, cb) {
//     // To specify the destination and on-error operation, we use the "cb" callback. The first parameter represents any possible errors.:
//     cb(null, "public/img/users");
//   },
//   filename(req, file, cb) {
//     // Get image extension from mimetype header (Ex: image/jpeg):
//     const ext = file.mimetype.split("/").at(1);

//     // Store file to the file system after naming it:
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });

// Temporarily save uploaded image to memory, instead of the disk, for image processing and manipulation:
const multerStorage = multer.memoryStorage();

const multerFilter = function (req, file, cb) {
  // Allow only images in the upload:
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Only image upload is allowed!", 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadUserPhoto = upload.single("photo");

exports.resizeUserPhoto = function (req, res, next) {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
};

exports.getMe = catchAsync(async function (req, res, next) {
  req.params.id = req.user.id;
  next();
});

exports.updateMe = catchAsync(async function (req, res, next) {
  // 1) Throw an error if the user POSTs password data to this endpoint:
  if (req.body.password || req.body.passwordConfirm)
    return next(
      new AppError(
        "This route is not for updating password. Please use /updateMyPassword for that.",
        400,
      ),
    );

  // 2) Filter the request body to keep only the fields that are allowed to change:
  const filteredBody = filterObj(req.body, "name", "email");
  // If the user changed their avatar, add the new file name to the document:
  if (req.file) filteredBody.photo = req.file.filename;

  if (!Object.keys(filteredBody).length)
    return next(new AppError("No valid data to update found!", 400));

  // 3) Update the user document with the new data:
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async function (req, res, next) {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.createUser = function (req, res) {
  res.status(500).json({
    status: "error",
    message: "This route is not defined! Please use /signup instead",
  });
};

exports.getUser = getOne(User);
exports.getAllUsers = getAll(User);

// The following controllers are only for administrator use, not for actions performed by a user:
exports.updateUser = updateOne(User);
exports.deleteUser = deleteOne(User);
