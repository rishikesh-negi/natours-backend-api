const fs = require("fs");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Tour = require("../../models/tourModel");

dotenv.config({ path: "../../config.env" });

const DB = process.env.DATABASE.replace("<PASSWORD>", process.env.DB_PASSWORD);

const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, "utf-8"));

async function populateCollection(model, collectionDataArr) {
  try {
    await model.create(collectionDataArr);
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

process.argv[2] === "--populate" && populateCollection(Tour, tours);
process.argv[2] === "--empty" && emptyCollection(Tour);
