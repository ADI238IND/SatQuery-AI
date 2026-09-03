import re


def normalize_answer(answer: str) -> str:
    answer = str(answer).lower().strip()

    answer = re.sub(r"\s+", " ", answer)

    answer = answer.strip(" .,!?:;")

    return answer