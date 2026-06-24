const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { processInputData } = require('./treeProcessor');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all origins (required for evaluation)
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// Main endpoint
app.post('/bfhl', (req, res) => {
  try {
    const { data } = req.body;

    if (!data) {
      return res.status(400).json({
        success: false,
        error: "Missing 'data' field in request body."
      });
    }

    if (!Array.isArray(data)) {
      return res.status(400).json({
        success: false,
        error: "'data' must be an array of connection strings."
      });
    }

    // Process the data using our core processor
    const result = processInputData(data);

    // Identity credentials from env or fallback defaults
    const response = {
      user_id: process.env.USER_ID || 'agam_monga_24062026',
      email_id: process.env.EMAIL_ID || 'agam.monga@college.edu',
      college_roll_number: process.env.COLLEGE_ROLL_NUMBER || '21CS1001',
      ...result
    };

    return res.json(response);
  } catch (error) {
    console.error("Error processing request:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error."
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
