const mongoose = require("mongoose");
const dotenv = require("dotenv");

// Handling Uncaught Exceptions Globally (Example: When a Non-existent Variable is Accessed):
process.on("uncaughtException", function (err) {
  console.log("🔴 Unhandled exception encountered! Shutting down...");
  console.log(`${err.name}: ${err.message}`);

  process.exit(1);
});
// console.log(x); // Unhandled Exception

dotenv.config({ path: "./config.env" });

const app = require("./app");

const DB = process.env.DATABASE.replace("<PASSWORD>", process.env.DB_PASSWORD);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => {
    process.env.NODE_ENV === "development" &&
      console.log("DB connected successfully");
  });

// console.log(app.get("env"));
// console.log(process.env);

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, function () {
  process.env.NODE_ENV === "development" &&
    console.log(`App running on port ${PORT}`);
});

// Callback Function for Graceful Shutdown Whenever an Uncaught Exception or Unhandled Rejection is Encountered:
function gracefulShutdown(err, errorMessage) {
  console.log(errorMessage);
  console.log(`${err.name}: ${err.message}`);

  server.close(() => process.exit(1));
}

// Handling Unhandled Promise Rejections Globally (Example: When the Server Fails to Connect with the Database):
process.on("unhandledRejection", function (err) {
  gracefulShutdown(err, "🔴 Unhandled rejection encountered! Shutting down...");
});
