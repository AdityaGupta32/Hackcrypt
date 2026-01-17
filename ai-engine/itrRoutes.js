const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const TaxCalculationEngine = require('../path/to/TaxCalculationEngine'); // Import your engine
const ITRCalculation = require('../db/models/ITRCalculation'); // Import the new model

// POST /api/itr/calculate
router.post('/calculate', async (req, res) => {
  try {
    const {
      userId, // Assuming you pass a user ID or session ID
      ageGroup,
      financialYear,
      incomeDetails, // Object: { salaryIncome, housePropertyIncome... }
      deductions // Object: { section80C, section80D... }
    } = req.body;

    // 1. Calculate Gross Total Income
    // We can use your engine's helper or sum it up manually here
    const grossIncome = TaxCalculationEngine.calculateTotalIncome(incomeDetails);

    // 2. Calculate Total Deductions
    // (Optional: You can add validation logic here using engine.validateDeductions)
    let totalDeductionsAmount = 0;
    for (let key in deductions) {
      totalDeductionsAmount += Number(deductions[key] || 0);
    }

    // 3. Apply Standard Deduction if applicable (Example logic)
    if (incomeDetails.salaryIncome > 0) {
      const stdDed = TaxCalculationEngine.getStandardDeduction(incomeDetails.salaryIncome);
      // Ensure we don't double count if user already subtracted it, 
      // but typically we subtract it from Gross Salary here.
      // For this example, let's assume 'grossIncome' passed includes raw salary
      // and we subtract standard deduction now.
      totalDeductionsAmount += stdDed;
    }

    // 4. Perform Tax Calculation
    // Note: calculateTax is synchronous in your class, but if you switch to 
    // calculateProgressiveTax (async), use 'await'.
    const calculation = TaxCalculationEngine.calculateTax(
      grossIncome,
      totalDeductionsAmount,
      ageGroup,
      financialYear
    );

    // 5. Identify ITR Form
    const itrForm = TaxCalculationEngine.identifyITRForm(incomeDetails);

    // 6. Calculate Effective Rate
    const effectiveRate = TaxCalculationEngine.calculateEffectiveTaxRate(
      calculation.totalTaxLiability,
      calculation.taxableIncome
    );

    // 7. Store Data in Database
    const newRecord = new ITRCalculation({
      userId: userId || uuidv4(), // Generate a temp ID if guest
      financialYear,
      ageGroup,
      incomeDetails: {
        ...incomeDetails,
        grossTotalIncome: grossIncome
      },
      deductionsBreakdown: {
        ...deductions,
        totalDeductions: totalDeductionsAmount
      },
      taxResult: {
        taxableIncome: calculation.taxableIncome,
        taxAmount: calculation.tax,
        surcharge: calculation.surcharge,
        cess: calculation.cess,
        totalTaxLiability: calculation.totalTaxLiability,
        effectiveTaxRate: effectiveRate
      },
      itrFormType: itrForm
    });

    await newRecord.save();

    // 8. Send Response
    res.status(200).json({
      success: true,
      message: "Tax calculated and saved successfully",
      data: newRecord
    });

  } catch (error) {
    console.error("ITR Tool Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;