const express = require("express");
const multer = require("multer");
const {
  getAllUsers,
  createUser,
  getUser,
  updateUser,
  deleteUser,
  updateMe,
  deleteMe,
  getMe,
} = require("../controllers/userController");

const {
  login,
  logout,
  signup,
  forgotPassword,
  resetPassword,
  updatePassword,
  protect,
  restrictTo,
} = require("../controllers/authController");

const upload = multer({ dest: "/public/img/users" });

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/logout", logout);

router.post("/forgotPassword", forgotPassword);
router.patch("/resetPassword/:token", resetPassword);

// Adding a "protect" middleware to the router, before all the routes that require authentication:
router.use(protect);

router.patch("/updateMyPassword", updatePassword);
router.get("/me", getMe, getUser);

router.patch("/updateMe", upload.single("photo"), updateMe);
router.delete("/deleteMe", deleteMe);

// Adding an "authorization" middleware to the router, before all the routes with role-based access:
router.use(restrictTo("admin"));

router.route("/").get(getAllUsers).post(createUser);
router.route("/:id").get(getUser).patch(updateUser).delete(deleteUser);

module.exports = router;
