from collections import defaultdict

from satquery.evaluation.metrics import exact_match


def category_accuracy(samples, predictions):

    stats = defaultdict(
        lambda: {
            "correct": 0,
            "total": 0
        }
    )

    for sample, prediction in zip(
        samples,
        predictions
    ):

        category = (
            sample.get("question_type")
            or "unknown"
        )

        correct = exact_match(
            prediction,
            sample["answer"]
        )

        stats[category]["correct"] += correct
        stats[category]["total"] += 1

    results = {}

    for category, values in stats.items():

        results[category] = (
            values["correct"]
            / values["total"]
        )

    return results