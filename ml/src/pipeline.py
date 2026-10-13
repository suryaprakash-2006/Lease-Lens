"""LeaseLens — Production Model Pipeline Definition
Path: ml/src/pipeline.py

Reusable, serializable pipeline wrapper encapsulating RentalPreprocessor,
regression model, and retransformation logic (naive median vs Duan's smearing).
"""

from typing import Any, Optional
import numpy as np
import pandas as pd
from preprocessing import RentalPreprocessor


class LeaseLensModelPipeline:
    """Production model wrapper combining RentalPreprocessor and regressor."""
    def __init__(
        self,
        preprocessor: RentalPreprocessor,
        model: Any,
        retransformation_method: str = "naive",
        ceiling_inr: float = 2000000.0,
    ):
        self.preprocessor = preprocessor
        self.model = model
        self.retransformation_method = retransformation_method
        self.ceiling_inr = ceiling_inr
        self.smear_factor_: float = 1.0
        self.log_residual_var_: float = 0.0

    def fit(self, train_df: pd.DataFrame) -> "LeaseLensModelPipeline":
        """Fit preprocessor and regression model strictly on training data."""
        self.preprocessor.fit(train_df)
        X_tr, y_tr_raw, y_tr_log = self.preprocessor.transform(train_df)
        self.model.fit(X_tr, y_tr_log)

        # Residuals in log-space for Duan's smearing correction
        train_pred_log = self.model.predict(X_tr)
        train_residuals_log = y_tr_log.values - train_pred_log
        self.smear_factor_ = float(np.mean(np.exp(train_residuals_log)))
        self.log_residual_var_ = float(np.var(train_residuals_log))
        return self

    def predict(self, df: pd.DataFrame, method: Optional[str] = None) -> np.ndarray:
        """Predict monthly rent in INR for input DataFrame."""
        use_method = method or self.retransformation_method
        X, _, _ = self.preprocessor.transform(df)
        pred_log = self.model.predict(X)

        if use_method == "smearing":
            y_inr = self.smear_factor_ * np.exp(pred_log) - 1.0
        elif use_method == "lognormal":
            y_inr = np.exp(self.log_residual_var_ / 2.0) * np.exp(pred_log) - 1.0
        else:
            y_inr = np.expm1(pred_log)

        return np.clip(y_inr, 0.0, self.ceiling_inr)
