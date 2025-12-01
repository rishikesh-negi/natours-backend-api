const express = require("express");

const {
  getOverview,
  getTourDetails,
} = require("../controllers/viewController");

const router = express.Router();

// Views (pug template) routes for rendering views:
router.get("/", getOverview);
router.get("/tour/:slug", getTourDetails);

module.exports = router;
