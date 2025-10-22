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
