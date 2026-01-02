const mongoose = require("mongoose");
const Tour = require("./tourModel");

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

// Creating a unique compound index to prevent a user from reviewing the same tour twice:
reviewSchema.index({ tour: 1, author: 1 }, { unique: true });

reviewSchema.pre(/^find/, async function () {
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
});

// Creating a static method on the Review model using the "statics" property of the Schema:
reviewSchema.statics.calcAverageRating = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: "$tour",
        nRating: { $sum: 1 },
        avgRating: { $avg: "$rating" },
      },
    },
  ]);

  await Tour.findByIdAndUpdate(tourId, {
    ratingsQuantity: stats[0]?.nRating || 0,
    ratingsAverage: stats[0]?.avgRating || 4.5,
  });
};

reviewSchema.post("save", function () {
  // "this" points to the review document being created:
  Review.calcAverageRating(this.tour);

  // At this point, the Review model has not been initialized, so we cannot directly reference it. We also cannot place this middleware after the declaration of the Review model because the Express code runs sequentially, and the review schema will not contain any middlewares that are defined after the review model is created. Instead, we can use this.constructor to reference it because the Review model is indeed the constructor of each review document:
  this.constructor.calcAverageRating(this.tour);
});

// In query middlewares like findByIdAndUpdate and findByIdAndDelete, we don't get direct access to the current document. So, we can use a workaround to access the current document in order to update the stats of the main data set when the related data set is updated using the aforementioned queries:
reviewSchema.pre(/^findOneAnd/, async function () {
  // In a "pre" middleware, "this" points to the query, not to the document. So, to get the current document, we can call the findOne() method on the query. Additionally, to pass the document into a "post" middleware for recalculation of the stats after the document or its updates have been saved, we can attach it to the query by creating a property on the query:
  this.reviewDoc = await this.findOne(); // The reviewDoc property can now be used in a "post" middleware to access the document and its data
  if (!this.reviewDoc) delete this.reviewDoc;
});
// In the above middleware, we could not have used "post" to calculate the aggregated ratings data because the "post" middlewares don't have access to the query (findOne, in this case) that we use to access the document. On the other hand, the "pre" middleware will not account for the new or updated document, because the document is yet to be saved/updated in the database. So, the solution is to create a "post" middleware that can access the document data that was attached to the query object by the "pre" middleware:

reviewSchema.post(/^findOneAnd/, async function () {
  // In a "post" middleware, "this" still points to the query. However, by the time the query reaches a "post" middleware, it is already executed. So, we could not use the .findOne() method on it to get the document, like we did in the above "pre" query middleware:
  if (!this.reviewDoc) return;
  await this.reviewDoc.constructor.calcAverageRating(this.reviewDoc.tour);
});

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
