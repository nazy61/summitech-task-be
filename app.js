const express = require("express");
const cors = require("cors");
const { config } = require("dotenv");
const mongoose = require("mongoose");
const { urlencoded, json } = require("body-parser");
const apiRoutes = require("./routes/routes");

config();
mongoose.set("strictQuery", true);
const app = express();
const port = process.env.PORT || 3000;
const dbConnectionString = process.env.DB_CONNECTION_STRING;

app.use(cors());
app.use(json());
app.use(urlencoded({ extended: false }));

// all routes
app.use("/v1", apiRoutes.userRoutes);

app.listen(port, () => {
  console.log(`Summitech app listening on port ${port}`);
  mongoose.connect(dbConnectionString);
});
