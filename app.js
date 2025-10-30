const express = require("express");
const path = require("path");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean"); // Deprecated. Use express-xss-sanitizer instead
const hpp = require("hpp");

const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");

const tourRouter = require("./routes/tourRoutes");
const userRouter = require("./routes/userRoutes");
const reviewRouter = require("./routes/reviewRoutes");

const app = express();

app.set("view engine", "pug");

// Use the "path" module to correctly set the path relative to the root folder of the project by joining the project directory name with the /views folder. The path.join() method correctly creates a path by combining the directory name with a subfolder name, allowing us to not worry about the slashes:
app.set("views", path.join(__dirname, "views"));

// ---------------------------------- Global Middlewares:
// Serving static files:
app.use(express.static(path.join(__dirname, "public")));

// Middleware for setting important HTTP security headers. Should ideally be first in the middleware stack:
app.use(helmet());

// Development logging:
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Middleware for rate limiting:
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message:
    "Too many requests from your IP address. Please try again in an hour.",
});
app.use("/api", limiter);

// Body parser. Reads data from the body into req.body. The "limit" options is used for specifying the maximum amount of data that can be put into a req/res body:
app.use(express.json({ limit: "10kb" }));

// Data Sanitization against NoSQL query injections:
app.use(mongoSanitize());

// Data Sanitization against XSS (cross-site scripting) attacks:
app.use(xss());

// Prevent tech fingerprinting:
app.disable("x-powered-by");

// Preventing URL Parameter Pollution:
app.use(
  hpp({
    whitelist: [
      "duration",
      "ratignsQuantity",
      "ratingsAverage",
      "maxGroupSize",
      "difficulty",
      "price",
    ],
  }),
);

// Test middleware:
app.use(function (req, res, next) {
  process.env.NODE_ENV === "development" &&
    console.log("This is the first middleware in the stack...");

  // The following uncaught exception will be encountered only when a request is received because that's when the middleware will run:
  // console.log(x);

  next();
});

app.use(function (req, res, next) {
  req.requestTime = new Date().toISOString();
  // console.log(req.headers);
  next();
});

/*
// Separated handling of each request:
app.get("/api/v1/tours", getAllTours);
app.get("/api/v1/tours/:id", getTour);
app.post("/api/v1/tours", createTour);
app.patch("/api/v1/tours/:id", updateTour);
app.delete("/api/v1/tours/:id", deleteTour);
*/

// Views (pug template) routes for rendering views:
app.get("/", (req, res, next) => {
  // The .render() method of the response object is used to render the specified pug template. Express will look for the specified pug temaplate in the path specified for the "views" folder:
  res.status(200).render("base");
});

// Mounting routers on the corresponding URIs:
app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/reviews", reviewRouter);

app.all("*", function (req, _, next) {
  // 1. Sending an error response:
  // res.status(404).json({
  //   status: "fail",
  //   message: `The requested resource ${req.originalUrl} does not exist`,
  // });

  // 2. Creating an Error instance and passing it into the global error handling middleware:
  // const err = new Error(
  //   `The requested resource ${req.originalUrl} does not exist`,
  // );
  // err.status = "fail";
  // err.statusCode = 404;

  // Any argument passed into the "next()" function call is treated as an error (or error object) by Express. Express then skips all the subsequent middlewares and passes the argument straight into the global error handling middleware:
  // next(err);

  // 3. Using a custom app error class to create and pass an error instance into the global error handling middleware:
  next(
    new AppError(
      `The requested resource ${req.originalUrl} does not exist`,
      404,
    ),
  );
});

app.use(globalErrorHandler);

module.exports = app;
