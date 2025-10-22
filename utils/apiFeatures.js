class APIFeatures {
  constructor(query, queryFieldsObj) {
    this.query = query;
    this.queryFieldsObj = queryFieldsObj;
  }

  filter() {
    // Building the query object (clone query object for mutation):
    const initialQueryObj = { ...this.queryFieldsObj };

    // 1A) Filtering based on query fields:
    const excludedFields = ["page", "sort", "limit", "fields"];
    // Exclude all the fields from the query object that do not filter data and are related to app-specific features:
    excludedFields.forEach((field) => delete initialQueryObj[field]);

    // 1B) Advanced filtering (Adding/Correcting comparison operators):
    // Example: /api/v1/tours/duration[gte]=5  ->  { duration: { gte: 5 } }   ->  but should be { duration: { '$gte': 5 } }
    const queryStr = JSON.stringify(initialQueryObj);
    const queryObj = JSON.parse(
      queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`),
    );

    this.query = this.query.find(queryObj);

    return this;
  }

  sort() {
    if (this.queryFieldsObj.sort) {
      const sortBy = this.queryFieldsObj.sort.split(",").join(" ");
      this.query = this.query.sort(sortBy);
    } else {
      // If no sorting criteria specified in the query, sort by the date created:
      this.query = this.query.sort("-createdAt");
    }

    return this;
  }

  limitFields() {
    if (this.queryFieldsObj.fields) {
      const fields = this.queryFieldsObj.fields.split(",").join(" ");
      this.query = this.query.select(fields); // Query.select() method selects the specified fields
    } else {
      // If no fields specified in the query, only exclude the "__v" field in the response ("-" sign excludes the field)
      this.query = this.query.select("-__v");
    }

    return this;
  }

  paginate() {
    const page = Number(this.queryFieldsObj.page) || 1;
    const limit = Number(this.queryFieldsObj.limit) || 50;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

module.exports = APIFeatures;
