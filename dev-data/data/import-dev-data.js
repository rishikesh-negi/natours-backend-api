const fs = require("fs");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Tour = require("../../models/tourModel");
const User = require("../../models/userModel");
const Review = require("../../models/reviewModel");

dotenv.config({ path: "../../config.env" });

const DB = process.env.DATABASE.replace("<PASSWORD>", process.env.DB_PASSWORD);

const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, "utf-8"));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, "utf-8"));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, "utf-8"),
);

async function populateCollection(model, collectionDataArr) {
  try {
    await model.create(collectionDataArr, { validateBeforeSave: false });
    console.log("Collection successfully populated");
  } catch (err) {
    console.log(err.message);
  } finally {
    process.exit();
  }
}

async function emptyCollection(model) {
  try {
    await model.deleteMany();
    console.log("All documents deleted");
  } catch (err) {
    console.log(err.message);
  } finally {
    process.exit();
  }
}

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => console.log("DB connected succesfully!"));

// process.argv[2] === "--populate" && populateCollection(Tour, tours);
// process.argv[2] === "--empty" && emptyCollection(Tour);

// process.argv[2] === "--populate" && populateCollection(User, users);
// process.argv[2] === "--empty" && emptyCollection(User);

process.argv[2] === "--populate" && populateCollection(Review, reviews);
process.argv[2] === "--empty" && emptyCollection(Review);
