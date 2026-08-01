// src/routes/billing.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { getOrganisation } = require('../middleware/organisation');
const billingController = require('../controllers/billing');

router.use(authenticate);
router.use(getOrganisation);

// GET billing/payment history for the org
router.get('/', billingController.history);

// POST start a Paystack checkout for a plan
router.post('/checkout', billingController.initiate);

module.exports = router;
