const express = require("express");
const cors = require("cors");

const pricingRoutes = require("./routes/pricingRoutes");
const errorHandler = require("./middleware/errorHandle");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/pricing", pricingRoutes);

app.use(errorHandler);

module.exports = app;