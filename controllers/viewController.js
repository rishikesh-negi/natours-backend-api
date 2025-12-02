const Tour = require("../models/tourModel");
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

exports.getTourDetails = catchAsync(async (req, res) => {
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: "reviews",
    fields: "review rating author",
  });

  res.status(200).render("tour", {
    title: tour.name,
    tour,
  });
});
