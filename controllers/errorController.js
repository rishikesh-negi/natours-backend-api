const AppError = require("../utils/appError");

const handleCastErrorDB = function (err) {
  const message = `Invalid ${err.path}: ${err.value}`;

  return new AppError(message, 400);
};

const handleValidationErrorDB = function (err) {
  const errors = Object.values(err.errors).map((val) => val?.message);

  const message = `Invalid inputs. ${errors?.join(". ")}`;

  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = function (err) {
  const [[field, value]] = Object.entries(err.keyValue);
  const message = `The field '${field}' must have a unique value. The value '${value}' is not unique.`;

  return new AppError(message, 404);
};

const handleJWTError = () =>
  new AppError("Invalid token. Please log in again", 401);

const handleJWTExpiredError = () =>
  new AppError("Session expired. Please log in again", 401);

const sendErrorDev = function (err, res) {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = function (err, res) {
  // Operational error: Send message to the client:
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
    // Programming or unknown error: Avoid sending error details to clients:
  } else {
    // 1. Log it to the console for debugging:
    // console.error("ERROR", err);

    // 2. Send a generic error message to clients:
    res.status(500).json({
      status: "error",
      message: "Something went wrong!",
    });
  }
};

module.exports = function (err, req, res, next) {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, res);
  }

  if (process.env.NODE_ENV === "production") {
    let error = { ...err };

    error.name = err.name || "";
    error.path = err.path || "";
    error.stack = err.stack || null;
    error.message = err.message || "";
    error.errors = err.errors || null;

    for (const property in err) {
      if (
        !error[property] &&
        !["name", "path", "stack", "message", "errors"].includes(property)
      ) {
        error[property] = err[property];
      }
    }

    if (error.name === "CastError") error = handleCastErrorDB(error);
    if (error.name === "ValidationError")
      error = handleValidationErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === "JsonWebTokenError") error = handleJWTError();
    if (error.name === "TokenExpiredError") error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }
};
