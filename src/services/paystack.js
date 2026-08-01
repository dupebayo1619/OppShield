const axios = require('axios');

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

/**
 * Initialize a transaction
 */
async function initializeTransaction(email, amount, metadata = {}) {
  try {
    const response = await axios.post(
      `${PAYSTACK_BASE_URL}/transaction/initialize`,
      {
        email,
        amount: amount * 100, // Paystack uses kobo (1 Naira = 100 kobo)
        metadata,
        callback_url: `${process.env.FRONTEND_URL}/payment/callback`,
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Paystack initialize error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Verify a transaction
 */
async function verifyTransaction(reference) {
  try {
    const response = await axios.get(
      `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Paystack verify error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Create a subscription plan
 */
async function createPlan(name, amount, interval = 'monthly') {
  try {
    const response = await axios.post(
      `${PAYSTACK_BASE_URL}/plan`,
      {
        name,
        amount: amount * 100,
        interval,
        currency: 'NGN',
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Paystack create plan error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Create a subscription
 */
async function createSubscription(customer, plan, authorization) {
  try {
    const response = await axios.post(
      `${PAYSTACK_BASE_URL}/subscription`,
      {
        customer,
        plan,
        authorization,
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Paystack create subscription error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * List transactions
 */
async function listTransactions() {
  try {
    const response = await axios.get(
      `${PAYSTACK_BASE_URL}/transaction`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Paystack list transactions error:', error.response?.data || error.message);
    throw error;
  }
}

module.exports = {
  initializeTransaction,
  verifyTransaction,
  createPlan,
  createSubscription,
  listTransactions,
};
