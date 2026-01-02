const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  tour: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tour",
    required: [true, "Booking must belong to a tour!"],
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Booking must have a customer!"],
  },
  price: {
    type: Number,
    require: [true, "The booking price is required!"],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  paid: {
    type: Boolean,
    default: true,
  },
});

bookingSchema.pre(/^find/, async function () {
  this.populate("user").populate({
    path: "tour",
    select: "name",
  });
});

const Booking = mongoose.model("Booking", bookingSchema);

module.exports = Booking;
