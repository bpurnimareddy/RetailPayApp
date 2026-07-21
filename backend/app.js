const express = require("express");
const cors = require("cors");

const pricingRoutes = require("./routes/pricingRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/pricing", pricingRoutes);

module.exports = app;