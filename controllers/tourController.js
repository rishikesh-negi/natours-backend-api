const Tour = require("../models/tourModel");

const catchAsync = require("../utils/catchAsync");

const {
  deleteOne,
  updateOne,
  createOne,
  getOne,
  getAll,
} = require("./handlerFactory");

// After implementing factory handler functions:
exports.getAllTours = getAll(Tour);
exports.getTour = getOne(Tour, { path: "reviews" });
exports.createTour = createOne(Tour);
exports.updateTour = updateOne(Tour);
exports.deleteTour = deleteOne(Tour);

exports.aliasBestFiveCheapTours = async function (req, res, next) {
  req.query.limit = "5";
  req.query.sort = "-ratingsAverage,price";
  req.query.fields = "name,price,ratingsAverage,summary,difficulty";

  next();
};

exports.getTourStats = catchAsync(async function (req, res) {
  const stats = await Tour.aggregate([
    {
      $match: {
        ratingsAverage: {
          $gte: 4.5,
        },
      },
    },
    {
      $group: {
        _id: {
          $toUpper: "$difficulty",
        },
        numTours: { $sum: 1 },
        numRatings: { $sum: "$ratingsQuantity" },
        avgRating: { $avg: "$ratingsAverage" },
        avgPrice: { $avg: "$price" },
        minPrice: { $min: "$price" },
        maxPrice: { $max: "$price" },
      },
    },
    {
      $sort: {
        avgPrice: 1,
      },
    },
  ]);

  res.status(200).json({
    status: "success",
    data: {
      stats,
    },
  });
});

exports.getMonthlyPlan = catchAsync(async function (req, res) {
  const year = Number(req.params.year);

  const plan = await Tour.aggregate([
    {
      $unwind: "$startDates",
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: "$startDates" },
        numTourStarts: { $sum: 1 },
        tours: { $push: "$name" },
      },
    },
    {
      $addFields: { month: "$_id" },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: {
        numTourStarts: -1,
      },
    },
    {
      $limit: 12,
    },
  ]);

  res.status(200).json({
    status: "success",
    data: {
      plan,
    },
  });
});

// FEATURES IMPLEMENTED IN THE getAllTours CONTROLLER BEFORE REFACTORING:
/*
// Building the query object (clone query object for mutation):
const initialQueryObj = { ...req.query };

// 1A) Filtering based on query fields:
const excludedFields = ["page", "sort", "limit", "fields"];
// Exclude all the fields from the query object that do not filter data and are related to app-specific features:
excludedFields.forEach((field) => delete initialQueryObj[field]);

// 1B) Advanced filtering (Adding/Correcting comparison operators):
// Example: /api/v1/tours/duration[gte]=5  ->  { duration: { gte: 5 } }   ->  but should be { duration: { '$gte': 5 } }
const queryStr = JSON.stringify(initialQueryObj);
const queryObj = JSON.parse(
  queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`),
);

// Create query:
let query = Tour.find(queryObj);
// --------------------------------------------------------------------


// 2) Sorting data:
if (req.query.sort) {
  const sortBy = req.query.sort?.split(",").join(" ");
  query = query.sort(sortBy);
} else {
  // If no sorting criteria specified in the query, sort by the date created:
  query = query.sort("-createdAt");
}
// --------------------------------------------------------------------

// 3) Field limiting (sending only requested fields as response):
if (req.query.fields) {
  const fields = req.query.fields.split(",").join(" ");
  query = query.select(fields); // Query.select() method selects the specified fields
} else {
  // If no fields specified in the query, only exclude the "__v" field in the response ("-" sign excludes the field)
  query = query.select("-__v");
}
// --------------------------------------------------------------------

// 4) Pagination (limiting documents sent at once):
const page = Number(req.query.page) || 1;
const limit = Number(req.query.limit) || 50;
const skip = (page - 1) * limit;

query = query.skip(skip).limit(limit);

if (req.query.page) {
  const numTours = await Tour.countDocuments();
  if (skip >= numTours)
    throw new Error("No more results. All results sent");
}
// --------------------------------------------------------------------

// WAYS OF FILTERING QUERIES:
// 1st Way of Filtering Using URL Queries:
const tours = await Tour.find({
  duration: 5,
  difficulty: "easy",
});

// 2nd (Mongoose) Way of Filtering:
const query = Tour.find()
  .where("duration")
  .equals(5)
  .where("difficulty")
  .equals("easy");
*/

// Before implementing the delete factory handler function:
// exports.deleteTour = catchAsync(async function (req, res, next) {
//   const tour = await Tour.findByIdAndDelete(req.params.id);

//   if (!tour) {
//     return next(new AppError("Couldn't find a tour with that ID", 404));
//   }

//   res.status(204).json({
//     status: "success",
//     data: null,
//   });
// });
