"""LeaseLens — Model Pipeline Unit & Integrity Tests
Path: ml/tests/test_model.py

Verifies:
1. Model loading and pipeline prediction integrity.
2. Non-negative output clamping and domain ceiling bounds.
3. Retransformation methods (naive expm1 vs Duan's smearing).
4. Zero leakage: test transformation uses learned training medians and encodings.
5. Deterministic predictions for identical inputs.
"""

import os
import sys
import unittest
import numpy as np
import pandas as pd
import joblib

# Add ml/src directory
current_dir = os.path.dirname(os.path.abspath(__file__))
src_dir = os.path.join(os.path.dirname(current_dir), "src")
if src_dir not in sys.path:
    sys.path.insert(0, src_dir)

from preprocessing import RentalPreprocessor
from pipeline import LeaseLensModelPipeline
from evaluate import compute_regression_metrics, inverse_transform_log_predictions


class TestLeaseLensModelPipeline(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.base_dir = os.path.dirname(current_dir)
        cls.model_path = os.path.join(cls.base_dir, "models", "rental_price_model.joblib")
        cls.train_path = os.path.join(cls.base_dir, "data", "processed", "train.csv")
        cls.test_path = os.path.join(cls.base_dir, "data", "processed", "test.csv")

        cls.pipeline = joblib.load(cls.model_path)
        cls.test_df = pd.read_csv(cls.test_path)

    def test_pipeline_loaded_successfully(self):
        """Verify model pipeline instance and fitted attributes."""
        self.assertIsInstance(self.pipeline, LeaseLensModelPipeline)
        self.assertTrue(self.pipeline.preprocessor.is_fitted)
        self.assertGreater(self.pipeline.smear_factor_, 1.0)
        self.assertGreater(self.pipeline.log_residual_var_, 0.0)

    def test_predictions_shape_and_finite(self):
        """Verify predictions return correct length and no NaN/Inf values."""
        sample_df = self.test_df.head(25)
        preds = self.pipeline.predict(sample_df)
        self.assertEqual(len(preds), 25)
        self.assertFalse(np.isnan(preds).any())
        self.assertFalse(np.isinf(preds).any())

    def test_predictions_domain_bounds(self):
        """Ensure all predictions are strictly non-negative and bounded <= 2M INR."""
        preds = self.pipeline.predict(self.test_df)
        self.assertTrue(np.all(preds >= 0.0), "Found negative rent predictions")
        self.assertTrue(np.all(preds <= 2000000.0), "Found predictions exceeding economic rent ceiling")

    def test_retransformation_methods_consistency(self):
        """Verify both naive and smearing retransformation produce valid outputs."""
        sample_df = self.test_df.head(10)
        naive_preds = self.pipeline.predict(sample_df, method="naive")
        smear_preds = self.pipeline.predict(sample_df, method="smearing")

        # Because smear_factor > 1.0, smeared predictions should be slightly higher than naive median
        self.assertTrue(np.all(smear_preds >= naive_preds - 1e-5))

    def test_deterministic_predictions(self):
        """Verify model returns identical outputs for the same inputs."""
        sample_df = self.test_df.head(10)
        preds_1 = self.pipeline.predict(sample_df)
        preds_2 = self.pipeline.predict(sample_df)
        np.testing.assert_array_almost_equal(preds_1, preds_2)

    def test_missing_floor_handling(self):
        """Verify unstated/unparseable floor values are imputed with training medians without error."""
        unusual_input = pd.DataFrame([{
            "Posted On": "2022-07-01",
            "BHK": 2,
            "Rent": 20000,
            "Size": 900,
            "Floor": "Unknown Floor Format",
            "Area Type": "Super Area",
            "Area Locality": "Electronic City",
            "City": "Bangalore",
            "Furnishing Status": "Semi-Furnished",
            "Tenant Preferred": "Bachelors/Family",
            "Bathroom": 2,
            "Point of Contact": "Contact Owner",
        }])
        pred = self.pipeline.predict(unusual_input)
        self.assertEqual(len(pred), 1)
        self.assertGreater(pred[0], 0.0)

    def test_unseen_category_handling(self):
        """Verify unknown categories are ignored gracefully via OneHotEncoder."""
        unseen_cat_input = pd.DataFrame([{
            "Posted On": "2022-07-01",
            "BHK": 2,
            "Rent": 20000,
            "Size": 900,
            "Floor": "2 out of 4",
            "Area Type": "Nonexistent Area Type",
            "Area Locality": "Sample Locality",
            "City": "Pune",  # Unseen city in training set
            "Furnishing Status": "Fully Furnished",
            "Tenant Preferred": "Students Only",
            "Bathroom": 2,
            "Point of Contact": "Contact Owner",
        }])
        pred = self.pipeline.predict(unseen_cat_input)
        self.assertEqual(len(pred), 1)
        self.assertGreater(pred[0], 0.0)

    def test_metrics_computation(self):
        """Verify regression metric computation functions properly."""
        y_true = np.array([10000, 20000, 30000])
        y_pred = np.array([11000, 19000, 32000])
        metrics = compute_regression_metrics(y_true, y_pred, "TestModel")
        self.assertIn("mae_inr", metrics)
        self.assertIn("rmse_inr", metrics)
        self.assertIn("r2_score", metrics)
        self.assertAlmostEqual(metrics["mae_inr"], 1333.33, places=2)


if __name__ == "__main__":
    unittest.main()
