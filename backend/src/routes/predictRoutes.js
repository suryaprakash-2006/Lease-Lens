// backend/src/routes/predictRoutes.js
import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validatorMiddleware.js';
import { body } from 'express-validator';
// Native fetch is available in Node v24 – no external node-fetch required

const router = express.Router();
router.use(protect);

const predictionValidation = [
  body('BHK').isInt({ min: 0 }).withMessage('BHK must be a non‑negative integer'),
  body('Size').isFloat({ gt: 0 }).withMessage('Size must be positive'),
  body('Bathroom').isInt({ min: 0 }).withMessage('Bathroom must be a non‑negative integer'),
  body('Floor').notEmpty().withMessage('Floor description required'),
  body('City').notEmpty().withMessage('City required'),
  body('Furnishing_Status').notEmpty().withMessage('Furnishing status required'),
  body('Tenant_Preferred').notEmpty().withMessage('Tenant preference required'),
  body('Area_Type').notEmpty().withMessage('Area type required'),
  validate,
];

router.post('/predict', predictionValidation, async (req, res) => {
  try {
    const payload = {
      BHK: req.body.BHK,
      Size: req.body.Size,
      Bathroom: req.body.Bathroom,
      Floor: req.body.Floor,
      City: req.body.City,
      Furnishing_Status: req.body.Furnishing_Status,
      Tenant_Preferred: req.body.Tenant_Preferred,
      Area_Type: req.body.Area_Type,
    };
    const response = await fetch('http://127.0.0.1:8000/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const err = await response.text();
      return res.status(502).json({ error: 'FastAPI service error', details: err });
    }
    const data = await response.json();
    res.json(data);
  } catch (e) {
    console.error('Prediction proxy error:', e);
    res.status(500).json({ error: 'Internal server error', details: e.message });
  }
});

export default router;
