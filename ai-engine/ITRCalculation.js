const mongoose = require('mongoose');

const ITRCalculationSchema = new mongoose.Schema({
  userId: {
    type: String, // Or mongoose.Schema.Types.ObjectId if referencing a User model
    required: true
  },
  financialYear: {
    type: String,
    default: '2023-24'
  },
  ageGroup: {
    type: String,
    enum: ['0-60', '60-80', '80+'],
    default: '0-60'
  },
  // --- Inputs ---
  incomeDetails: {
    salaryIncome: { type: Number, default: 0 },
    housePropertyIncome: { type: Number, default: 0 },
    businessIncome: { type: Number, default: 0 },
    capitalGains: { type: Number, default: 0 },
    otherIncome: { type: Number, default: 0 },
    grossTotalIncome: { type: Number, required: true }
  },
  deductionsBreakdown: {
    section80C: { type: Number, default: 0 },
    section80D: { type: Number, default: 0 },
    otherDeductions: { type: Number, default: 0 },
    totalDeductions: { type: Number, default: 0 }
  },
  // --- Calculation Results ---
  taxResult: {
    taxableIncome: Number,
    taxAmount: Number,
    surcharge: Number,
    cess: Number,
    totalTaxLiability: Number,
    effectiveTaxRate: String
  },
  itrFormType: {
    type: String, // e.g., "ITR-1", "ITR-2"
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ITRCalculation', ITRCalculationSchema);