const crypto = require("crypto");
const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const { passwordValidator } = require("../utils/stringValidators");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter your name"],
    trim: true,
    maxlength: [
      100,
      "You name cannot exceed 100 characters. Please avoid writing middlenames",
    ],
    minlength: [5, "A valid fullname has at least 5 characters"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    trim: true,
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Please provide a valid email address"],
    maxlength: [100, "You email address cannot exceed 100 characters"],
    message: "Please enter a valid email ID",
  },
  photo: { type: String, default: "default.jpeg" },
  role: {
    type: String,
    enum: ["user", "guide", "lead-guide", "admin"],
    default: "user",
  },
  password: {
    type: String,
    required: [true, "Please enter a password"],
    maxlength: [72, "Your password cannot exceed 72 characters"],
    validate: {
      validator: passwordValidator,
      message:
        "A password must have at least: 8 characters, an uppercase letter, a lowercase letter, a number, a special character",
    },
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, "Please confirm your password"],
    validate: {
      // Only runs on CREATE and SAVE, not on UPDATE:
      validator(val) {
        return val === this.password;
      },
      message: "Passwords do not match",
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 12);

  this.passwordConfirm = undefined;

  next();
});

userSchema.pre("save", function (next) {
  // The .isModified("password") method returns true when a new document is created and saved with a new password. But, we dont want to add passwordChangedAt when a new document is saved. So, we use the this.isNew property of the document to check if it's a new document:
  if (!this.isModified("password") || this.isNew) return next();

  // IMPORTANT: Saving a document to the DB is usually slower than creating and sending a JWT to the user. So, after a password reset, it is likely that the new passwordChangedAt will be greater than the "iat" property of the new JWT, thus wrongly making the new JWT invalid (expired). So, as a standard practice, we subtract 1 second (1000ms) from the new passwordChangedAt timestamp:
  this.passwordChangedAt = Date.now() - 1000;

  next();
});

userSchema.pre(/^find/, function (next) {
  // Since this is a query middleware, "this" points to the current query.
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.matchPasswords = async function (
  candidatePassword,
  userPassword,
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const passwordChangeTimestamp = Number.parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );

    return JWTTimestamp < passwordChangeTimestamp;
  }

  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  // NOTE: After updating the passwordResetToken and passwordResetExpires fields in this method, we are not saving the document to the DB. So, after calling this method, the document should be saved in the corresponding middleware.

  // The reset token works like a temporary password, in a way. Its un-encrypted version should not be stored in the DB, because if a hacker obtains access to our DB, he can take control of accounts using the unencrypted reset tokens that have not yet expired:
  const resetToken = crypto.randomBytes(32).toString("hex");

  // Reset tokens do not need strong encryption because they make for a way less dangerous "attack vector". So, the built-in "crypto" module is enough for encryption. Hashing the reset token:
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Set a ten-minute token expiry time:
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  // Return the reset token to allow sending it via email:
  return resetToken;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
