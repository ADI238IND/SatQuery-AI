from dataclasses import dataclass
from typing import Optional


@dataclass
class SatQuerySample:
    image: str
    question: str
    answer: str

    task: str = "vqa"
    source: str = "vrsbench"

    question_type: Optional[str] = None
    question_id: Optional[int] = None