const csv = require("csv-parser");
const { Readable } = require("stream");
const Pricing = require("../models/pricing");

const normalizeKey = (key) =>
  key
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");

const mapRowToRecord = (row) => {
  const normalized = {};

  Object.entries(row).forEach(([key, value]) => {
    normalized[normalizeKey(key)] = String(value).trim();
  });

  const storeId =
    normalized.storeid || normalized.store || normalized["store#"];
  const sku = normalized.sku;
  const productName =
    normalized.productname || normalized.product || normalized.name;
  const price = normalized.price;
  const date = normalized.date;

  if (!storeId || !sku || !productName || !price || !date) {
    return null;
  }

  const parsedPrice = Number(price);
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedPrice) || Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return {
    storeId,
    sku,
    productName,
    price: parsedPrice,
    date: parsedDate,
  };
};

const parseCsvBuffer = (buffer) =>
  new Promise((resolve, reject) => {
    const records = [];
    const errors = [];

    Readable.from(buffer)
      .pipe(csv())
      .on("data", (row) => {
        const record = mapRowToRecord(row);
        if (record) {
          records.push(record);
        } else {
          errors.push(`Invalid row: ${JSON.stringify(row)}`);
        }
      })
      .on("end", () => resolve({ records, errors }))
      .on("error", reject);
  });

exports.uploadPricingCSV = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a CSV file",
      });
    }

    const { records, errors } = await parseCsvBuffer(req.file.buffer);

    if (records.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid records found in CSV",
        errors,
      });
    }

    const savedRecords = await Pricing.insertMany(records, {
      ordered: false,
    });

    res.status(201).json({
      success: true,
      message: `${savedRecords.length} record(s) uploaded successfully`,
      count: savedRecords.length,
      data: savedRecords,
      errors,
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllPricing = async (req, res, next) => {
  try {
    const records = await Pricing.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    next(error);
  }
};

exports.updatePricing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { productName, price } = req.body;

    if (!productName || price === undefined || price === null || price === "") {
      return res.status(400).json({
        success: false,
        message: "Product Name and Price are required",
      });
    }

    const parsedPrice = Number(price);

    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({
        success: false,
        message: "Price must be a valid positive number",
      });
    }

    const updatedRecord = await Pricing.findByIdAndUpdate(
      id,
      {
        productName: productName.trim(),
        price: parsedPrice,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedRecord) {
      return res.status(404).json({
        success: false,
        message: "Pricing record not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Record updated successfully",
      data: updatedRecord,
    });
  } catch (error) {
    next(error);
  }
};