const mongoose = require("mongoose");

const stockSchema = new mongoose.Schema(
  {
    batchId: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Stock", stockSchema);
