const APIFeatures = require("../utils/apiFeatures");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

function getModelName(Model) {
  return (
    Model.modelName[0].toLowerCase() + Model.modelName.slice(1) || "document"
  );
}

exports.deleteOne = function (Model) {
  const resourceName = getModelName(Model);

  return catchAsync(async function (req, res, next) {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError(`No ${resourceName} with that ID found`, 404));
    }

    res.status(204).json({
      status: "success",
      data: null,
    });
  });
};

exports.updateOne = function (Model) {
  const resourceName = getModelName(Model);

  return catchAsync(async function (req, res, next) {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return next(
        new AppError(`Couldn't find a ${resourceName} with that ID`, 404),
      );
    }

    res.status(200).json({
      status: "success",
      data: {
        [`${resourceName}`]: doc,
      },
    });
  });
};

exports.createOne = function (Model) {
  const resourceName = getModelName(Model);

  return catchAsync(async function (req, res) {
    // Older way of creating a document:
    // const newTour = new Tour({ /* DATA HERE */ });
    // newTour.save().then((res) => /* Fn BODY HERE */);

    // Easier and Better way:
    const newDoc = await Model.create(req.body);

    res.status(201).json({
      status: "success",
      data: {
        [`${resourceName}`]: newDoc,
      },
    });
  });
};

exports.getOne = function (Model, populateOptions = null) {
  const resourceName = getModelName(Model);

  return catchAsync(async function (req, res, next) {
    const query = populateOptions
      ? Model.findById(req.params.id).populate(populateOptions)
      : Model.findById(req.params.id);

    const doc = await query;

    if (!doc) {
      return next(
        new AppError(`Couldn't find a ${resourceName} with that ID`, 404),
      );
    }

    res.status(200).json({
      status: "success",
      data: {
        [`${resourceName}`]: doc,
      },
    });
  });
};

exports.getAll = function (Model) {
  const resourceName = getModelName(Model);

  return catchAsync(async function (req, res) {
    // To allow retrieval of tour reviews via the review route nested in the tour route (hack):
    const filter = req.params.tourId ? { tour: req.params.tourId } : {};

    // Execute query to get data:
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    // The .explain() method provides statistics about the query:
    // const docs = await features.query.explain();

    const docs = await features.query;

    // Send response:
    res.status(200).json({
      status: "success",
      results: docs.length,
      data: {
        [resourceName]: docs,
      },
    });
  });
};
