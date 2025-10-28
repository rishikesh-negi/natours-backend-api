const express = require("express");
const tourController = require("../controllers/tourController");
const { protect, restrictTo } = require("../controllers/authController");

const reviewRouter = require("./reviewRoutes");

const router = express.Router();

const {
  getAllTours,
  createTour,
  getTour,
  updateTour,
  deleteTour,
  aliasBestFiveCheapTours,
  getTourStats,
  getMonthlyPlan,
  getToursWithin,
} = tourController;

// Nesting the Review Routes Into the Tour Route:
router.use("/:tourId/reviews", reviewRouter);

router.route("/5-best-and-cheap").get(aliasBestFiveCheapTours, getAllTours);
router.route("/tour-stats").get(getTourStats);
router
  .route("/monthly-plan/:year")
  .get(protect, restrictTo("admin", "lead-guide", "guide"), getMonthlyPlan);

router
  .route("/tours-within/:distance/center/:latlng/unit/:unit")
  .get(getToursWithin);

router
  .route("/")
  .get(getAllTours)
  .post(protect, restrictTo("admin", "lead-guide"), createTour);
router
  .route("/:id")
  .get(getTour)
  .patch(protect, restrictTo("admin", "lead-guide"), updateTour)
  .delete(protect, restrictTo("admin", "lead-guide"), deleteTour);

module.exports = router;
