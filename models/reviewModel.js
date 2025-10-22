const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    rating: {
      type: Number,
      required: true,
      max: [5, "The highest rating you can provide is 5"],
      min: [1, "The lowest rating you can provide is 1"],
    },
    review: {
      type: String,
      required: [true, "Review cannot be empty"],
      trim: true,
      maxlength: [
        500,
        "You have exceeded the maximum review length of 500 characters!",
      ],
      minlength: [2, "A review must have at least one word"],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    author: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "A review must have an author"],
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: "Tour",
      required: [true, "A review must belong to a tour"],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

reviewSchema.pre(/^find/, function (next) {
  // this.populate({
  //   path: "author",
  //   select: "name photo",
  // }).populate({
  //   path: "tour",
  //   select: "name",
  // });

  this.populate({
    path: "author",
    select: "name photo",
  });

  next();
});

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
