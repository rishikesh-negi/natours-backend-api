const express = require("express");

const {
  getOverview,
  getTourDetails,
  getLoginPage,
  getAccount,
  updateUserData,
  getMyBookedTours,
  alert,
} = require("../controllers/viewController");

const { isLoggedIn, protect } = require("../controllers/authController");
// const { createBookingCheckout } = require("../controllers/bookingController");

const router = express.Router();

// Use middleware to add request-specific variables from the URL query string to the res.locals object:
router.use(alert);

// Views (pug template) routes for rendering views:
router.get("/", isLoggedIn, getOverview);
router.get("/login", isLoggedIn, getLoginPage);
router.get("/tour/:slug", isLoggedIn, getTourDetails);
router.get("/me", protect, getAccount);
router.get(
  "/my-booked-tours",
  /* createBookingCheckout, */ protect,
  getMyBookedTours,
);

router.post("/submit-user-data", protect, updateUserData);

module.exports = router;
