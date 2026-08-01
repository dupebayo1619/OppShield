// src/middleware/validate.js
const { validationResult } = require('express-validator');

function validate(req, res, next) {
  // Skip validation for login endpoint (it doesn't have validation rules)
  if (req.path === '/login') {
    return next();
  }
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      error:  'Validation failed',
      fields: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
}

module.exports = { validate };
