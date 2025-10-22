const express = require("express");
const {
  getAllReviews,
  createReview,
  deleteReview,
  updateReview,
  setTourUserIds,
  getReview,
} = require("../controllers/reviewController");

const { protect, restrictTo } = require("../controllers/authController");

// Since the review routes are nested within the tour route, the review router's mergeParams property needs to be set to true to allow the review routes to access the URL params of the "parent" tour route:
const router = express.Router({ mergeParams: true });

router
  .route("/")
  .get(getAllReviews)
  .post(protect, restrictTo("user"), setTourUserIds, createReview);

router.route("/:id").get(getReview).patch(updateReview).delete(deleteReview);

module.exports = router;
