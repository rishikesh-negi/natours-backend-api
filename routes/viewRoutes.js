const express = require("express");

const {
  getOverview,
  getTourDetails,
  getLoginPage,
} = require("../controllers/viewController");

const { isLoggedIn } = require("../controllers/authController");

const router = express.Router();

router.use(isLoggedIn);

// Views (pug template) routes for rendering views:
router.get("/", getOverview);
router.get("/login", getLoginPage);
router.get("/tour/:slug", getTourDetails);

module.exports = router;
