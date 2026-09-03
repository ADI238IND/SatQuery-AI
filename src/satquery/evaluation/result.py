from dataclasses import dataclass
from typing import Optional


@dataclass
class PredictionResult:
    id: int

    question: str
    ground_truth: str
    prediction: str

    question_type: Optional[str] = None

    correct: Optional[int] = None