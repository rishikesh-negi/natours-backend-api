const mongoose = require("mongoose");
const slugify = require("slugify");
// const validator = require("validator");
// const User = require("./userModel");

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "A tour must have a name"],
      unique: true,
      trim: true,
      maxlength: [40, "A tour name cannot exceed 40 characters in length"],
      minlength: [10, "A tour name must have at least 10 characters"],
      // validate: [validator.isAlpha, "A tour name must only contain letters"], // Treats spaces as invalid characters
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, "A tour must have a duration"],
    },
    maxGroupSize: {
      type: Number,
      required: [true, "A tour must have limited participants"],
    },
    difficulty: {
      type: String,
      required: [true, "A tour's difficulty level must be specified"],
      enum: {
        values: ["easy", "medium", "difficult"],
        message:
          "The only valid tour difficulty levels are: easy, medium, difficult",
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, "Rating must be greater than 0"],
      max: [5, "Rating cannot be greater than 5.0"],
      set: (val) => val.toFixed(1),
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, "A tour must have a price"],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          return val < this.price;
        },
        message:
          "The discounted amount ({VALUE}) cannot be greater than the tour price",
      },
    },
    summary: {
      type: String,
      required: [true, "A tour must have a summary"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, "A tour must have a cover image"],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      // GeoJSON data format in MongoDB for geospatial data:
      type: {
        type: String,
        default: "Point",
        enum: ["Point"],
      },
      // The coordinates property gets an array of numbers.
      // NOTE: The array must contain longitude first, then latitude, which is the reverse of how coordinates are usually represented:
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: "Point",
          enum: ["Point"],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [{ type: mongoose.Schema.ObjectId, ref: "User" }],
  },
  {
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  },
);

// // Single-Field Index:
// tourSchema.index({ price: 1 });
tourSchema.index({ slug: 1 });
// Compound Index:
tourSchema.index({ price: 1, ratingsAverage: -1 });
// Indexing Geospatial Fields:
tourSchema.index({ startLocation: "2dsphere" });

tourSchema.virtual("durationWeeks").get(function () {
  return this.duration / 7;
});

// VIRTUAL POPULATE:
tourSchema.virtual("reviews", {
  ref: "Review",
  foreignField: "tour",
  localField: "_id",
});

// DOCUMENT MIDDLEWARE (pre save hook) - Runs before .save() and .create(), not before .insertMany():
tourSchema.pre("save", async function () {
  this.slug = slugify(this.name, { lower: true });
});

// Embedding tour guide documents into the tour documnts:
// tourSchema.pre("save", async function (next) {
//   const guidesPromises = this.guides?.map((guideId) => User.findById(guideId));
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });

// // DOCUMENT MIDDLEWARE (post save hook) - Runs after .save() and .create(), not before .insertMany():
// tourSchema.post("save", function (doc, next) {
//   console.log(doc);
//   next;
// });

// QUERY MIDDLEWARE (pre find hook) - Runs before a find query is executed:
// tourSchema.pre("find", function (next) {
tourSchema.pre(/^find/, async function () {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
});

// Populating the queried tour documents with the guides (User documents):
tourSchema.pre(/^find/, async function () {
  this.populate({
    path: "guides",
    select: "-__v -passwordChangedAt",
  });
});

/*
// QUERY MIDDLEWARE (post find hook) - Runs after a find query is executed:
tourSchema.post(/^find/, function (docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds to execute`);

  next();
});
*/

// AGGREGATION MIDDLEWARE - Runs before/after an aggregation pipeline.
// NOTE: This middleware was commented out because its aggregation stage runs before the $geoNear stage, used in a route handler to return the distances of all tours' starting locations from a given reference point. The $geoNear stage needs to be the first stage in an aggregation pipeling for it to work:
// tourSchema.pre("aggregate", function (next) {
//   this.pipeline().unshift({
//     $match: { secretTour: { $ne: true } },
//   });

//   next();
// });

const Tour = mongoose.model("Tour", tourSchema);

module.exports = Tour;
