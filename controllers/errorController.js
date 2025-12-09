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

const sendErrorDev = function (err, req, res) {
  if (req.originalUrl.startsWith("/api")) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }
  return res.status(err.statusCode).render("error", {
    title: "Something went wrong!",
    msg: err.message,
  });
};

const sendErrorProd = function (err, req, res) {
  if (req.originalUrl.startsWith("/api")) {
    // Operational error: Send message to the client:
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }

    // Programming or unknown error: Avoid sending error details to clients:
    // 1. Log it to the console for debugging:
    console.error("ERROR", err);

    // 2. Send a generic error message to clients:
    return res.status(500).json({
      status: "error",
      message: "Something went wrong!",
    });
  }

  switch (err.isOperational) {
    case true:
      return res.status(err.statusCode).render("error", {
        title: "Something went wrong!",
        msg: err.message,
      });
    case false:
      return res.status(err.statusCode).render("error", {
        title: "Something went wrong!",
        msg: "Please try again later!",
      });
    default:
      break;
  }
};

module.exports = function (err, req, res, next) {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, req, res);
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

    sendErrorProd(error, req, res);
  }
};
