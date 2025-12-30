const Review = require("../models/reviewModel");
// const catchAsync = require("../utils/catchAsync");
const {
  deleteOne,
  updateOne,
  createOne,
  getOne,
  getAll,
} = require("./handlerFactory");

// A middleware that runs before createReview to perform the operations that are not included in the createOne factory handler function. This middleware should also be added in the review route before the createReview controller:
exports.setTourUserIds = function (req, res, next) {
  req.body.tour = req.body.tour || req.params.tourId;
  req.body.author = req.body.author || req.user.id;

  next();
};

exports.getReview = getOne(Review, [{ path: "author", select: "name photo" }]);
exports.getAllReviews = getAll(Review);
exports.createReview = createOne(Review);
exports.deleteReview = deleteOne(Review);
exports.updateReview = updateOne(Review);
