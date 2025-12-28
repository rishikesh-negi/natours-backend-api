const express = require("express");

const {
  getOverview,
  getTourDetails,
  getLoginPage,
  getAccount,
  updateUserData,
} = require("../controllers/viewController");

const { isLoggedIn, protect } = require("../controllers/authController");
const { createBookingCheckout } = require("../controllers/bookingController");

const router = express.Router();

// Views (pug template) routes for rendering views:
router.get("/", createBookingCheckout, isLoggedIn, getOverview);
router.get("/login", isLoggedIn, getLoginPage);
router.get("/tour/:slug", isLoggedIn, getTourDetails);
router.get("/me", protect, getAccount);
router.post("/submit-user-data", protect, updateUserData);

module.exports = router;
