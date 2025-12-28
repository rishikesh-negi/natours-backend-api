const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const catchAsync = require("../utils/catchAsync");
const factory = require("./handlerFactory");
const AppError = require("../utils/appError");

const Tour = require("../models/tourModel");
const Booking = require("../models/bookingModel");

exports.getCheckoutSession = catchAsync(async function (req, res) {
  // 1) Get the tour being booked:
  const tour = await Tour.findById(req.params.tourId);

  // 2) Create the checkout session:
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    success_url: `${req.protocol}://${req.get("host")}/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`,
    cancel_url: `${req.protocol}://${req.get("host")}/tour/${tour.slug}`,
    customer_email: req.user.email,
    mode: "payment",

    // Passes some data about the session. Gives us access to the session object after a successful transaction, allowing us to create a booking in the DB:
    client_reference_id: req.params.tourId,

    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [`https://natours.dev/img/tours/${tour.imageCover}`],
          },
          unit_amount_decimal: tour.price * 100,
        },
        quantity: 1,
      },
    ],
  });

  // 3) Send the checkout session as response to the client:
  res.status(200).json({
    status: "success",
    session,
  });
});

// Temporary (and unsecure) solution for creating a booking in the DB after a successful checkout. Requires the storage of sensitive data in the URL, which is exposed to the client and can be used by any user to create a booking without making a payment. Used in development when the application is not yet deployed (no actual domain). Added to the "/" route in viewRoutes, because that is the checkout session's success URL. To be replaced by a real solution involving Stripe Webhooks after app deployment (when the real app domain is available):
exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  const { tour, user, price } = req.query;

  if (tour && user && price) {
    await Booking.create({ tour, user, price });

    // Redirect to the original URL but without the query data to render the home page normally:
    res.redirect(req.originalUrl.split("?")[0]);
  }

  // If there is no tour, user, or price data in the URL query, simply call the next middleware in the "/" route's middleware stack in viewRoutes to render the home page in the usual way:
  next();
});
