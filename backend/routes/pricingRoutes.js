const express = require("express");
const upload = require("../middleware/upload");
const {
  uploadPricingCSV,
  getAllPricing,
  updatePricing,
} = require("../controllers/pricingController");

const router = express.Router();

router.post("/upload", upload.single("file"), uploadPricingCSV);
router.get("/", getAllPricing);
router.put("/:id", updatePricing);

module.exports = router;