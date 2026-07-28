const multer = require("multer");

const errorHandler = (err, req, res, next) => {
  console.error(err.stack || err.message);

  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message:
        err.code === "LIMIT_FILE_SIZE"
          ? "File too large. Maximum size is 5MB."
          : err.message,
    });
  }

  if (err.message === "Only CSV files are allowed") {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
};

module.exports = errorHandler;