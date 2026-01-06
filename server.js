const dotenv = require("dotenv");
const mongoose = require("mongoose");

// Handling Uncaught Exceptions Globally (Example: When a Non-existent Variable is Accessed):
process.on("uncaughtException", function (err) {
  console.log("🔴 Unhandled exception encountered! Shutting down...");
  console.log(`${err.name}: ${err.message}`);

  process.exit(1);
});
// console.log(x); // Unhandled Exception

dotenv.config({ path: "./config.env" });

const app = require("./app");

const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  encodeURIComponent(process.env.DB_PASSWORD),
);

mongoose.connect(DB).then(() => {
  process.env.NODE_ENV === "development" &&
    console.log("DB connected successfully");
});

// console.log(app.get("env"));
// console.log(process.env);

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, "0.0.0.0", function () {
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

// Handle SIGTERM signals sent by hosting platforms to restart the service and keep it healthy:
const shutdown = async (signal) => {
  console.log(`\n🚦Received ${signal}. Shutting down gracefully...`);

  // Stop accepting new connections:
  server.close(async () => {
    console.log("⛔HTTP server closed");

    try {
      // Close DB connection:
      await mongoose.connection.close();
      console.log("🧹Cleanup completed!💯");
      process.exit(0);
    } catch (err) {
      console.error("Server shutdown", err);
      process.exit(1);
    }
  });

  // Safety fallback (Render allows ~30s):
  setTimeout(() => {
    console.error("Force shutdown");
    process.exit(1);
  }, 30000);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
// Why this is needed:
// To restart the service and keep it healthy, Render sends a "SIGTERM" signal, waits ~30 seconds, sends a "SIGKILL" signal to kill the process if the app is still running. If the server shutdown is abrupt, any pending, unhandled requests will remain unhandled, and the data in the DB could corrupt.
// So, we need to listen for "SIGTERM" and if the signal is detected:
// 1. Stop accepting new traffic.
// 2. Clean up resources.
// 3. Exit cleanly before timeout.
