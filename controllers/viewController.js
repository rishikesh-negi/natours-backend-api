const Tour = require("../models/tourModel");
const User = require("../models/userModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

exports.getOverview = catchAsync(async (req, res, next) => {
  // 1) Get the data of all tours from the API:
  const tours = await Tour.find();

  // 2) Build template
  // Done in overview.pug

  // 3) Render the template using the fetched data:
  // Done in overview.pug

  res.status(200).render("overview", {
    title: "All Tours",
    tours,
  });
});

exports.getTourDetails = catchAsync(async (req, res, next) => {
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: "reviews",
    fields: "review rating author",
  });

  if (!tour) return next(new AppError("No tour with that name found!", 404));

  res.status(200).render("tour", {
    title: tour.name,
    tour,
  });
});

exports.getLoginPage = (req, res) => {
  res.status(200).render("login", {
    title: "Log into Natours",
  });
};

exports.getAccount = (req, res) => {
  res.status(200).render("account", {
    title: "Your account",
  });
};

exports.updateUserData = catchAsync(async (req, res, next) => {
  const { name, email } = req.body;

  if (!(name || email))
    next(new AppError("Invalid request! Missing data", 401));

  const user = await User.findById(req.user.id);
  if (name === user.name && email === user.email) return;

  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    { name, email },
    { new: true, runValidators: true },
  );

  res.status(200).render("account", {
    title: "Your account",
    user: updatedUser,
  });
});
