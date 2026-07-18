const express = require('express');
const auth = require('../middleware/authMiddleware');

const router = express.Router();

// New tax regime slabs, FY 2025-26 (post Budget 2025)
const SLABS = [
  { upto: 400000, rate: 0 },
  { upto: 800000, rate: 0.05 },
  { upto: 1200000, rate: 0.10 },
  { upto: 1600000, rate: 0.15 },
  { upto: 2000000, rate: 0.20 },
  { upto: 2400000, rate: 0.25 },
  { upto: Infinity, rate: 0.30 },
];

const STANDARD_DEDUCTION = 75000;
const REBATE_87A_LIMIT = 1200000; // taxable income up to this = zero tax
const CESS_RATE = 0.04;

// Where the rupee goes — grouped from Union Budget 2025-26 (Revised Estimates)
// department-wise allocation, published by the Ministry of Finance.
// Source: Union Budget documents / govtbudget.com analysis of Budget 2025-26.
const SPENDING_BREAKDOWN = [
  { category: 'Interest payments & debt servicing', icon: 'coin', percent: 36.8 },
  { category: 'Defence', icon: 'shield', percent: 14.2 },
  { category: 'Infrastructure (roads & railways)', icon: 'road', percent: 10.8 },
  { category: 'Agriculture & rural development', icon: 'plant', percent: 9.6 },
  { category: 'Home affairs & security', icon: 'building-bank', percent: 4.7 },
  { category: 'Food & public distribution', icon: 'basket', percent: 4.5 },
  { category: 'Education', icon: 'book', percent: 2.6 },
  { category: 'Healthcare', icon: 'heartbeat', percent: 1.9 },
  { category: 'Other public services', icon: 'building-community', percent: 14.9 },
];

function calculateTax(grossIncome) {
  const taxable = Math.max(0, grossIncome - STANDARD_DEDUCTION);

  let tax = 0;
  let prev = 0;
  for (const bracket of SLABS) {
    if (taxable <= prev) break;
    const amountInBracket = Math.min(taxable, bracket.upto) - prev;
    tax += amountInBracket * bracket.rate;
    prev = bracket.upto;
  }

  if (taxable <= REBATE_87A_LIMIT) {
    tax = 0;
  }

  const cess = tax * CESS_RATE;
  const totalTax = Math.round(tax + cess);

  return { taxable, totalTax };
}

// Estimate tax + show where it would go based on published budget allocation
router.post('/insights', auth, (req, res) => {
  try {
    const { income } = req.body;
    const grossIncome = Number(income);

    if (!grossIncome || grossIncome < 0) {
      return res.status(400).json({ error: 'Please provide a valid yearly income' });
    }

    const { taxable, totalTax } = calculateTax(grossIncome);
    const effectiveRate = grossIncome > 0 ? +((totalTax / grossIncome) * 100).toFixed(1) : 0;

    const breakdown = SPENDING_BREAKDOWN.map((item) => ({
      category: item.category,
      icon: item.icon,
      percent: item.percent,
      amount: Math.round((totalTax * item.percent) / 100),
    }));

    res.json({
      grossIncome,
      taxableIncome: taxable,
      estimatedTax: totalTax,
      effectiveRate,
      breakdown,
      note: 'Estimate only, based on the new tax regime (FY 2025-26) and the latest published Union Budget allocation percentages. Assumes salaried standard deduction; does not account for surcharge, marginal relief, or other deductions.',
    });
  } catch (err) {
    res.status(500).json({ error: 'Could not calculate tax insights' });
  }
});

module.exports = router;