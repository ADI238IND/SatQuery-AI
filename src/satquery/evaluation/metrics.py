from satquery.data.normalize import normalize_answer


def exact_match(prediction: str, ground_truth: str) -> int:
    prediction = normalize_answer(prediction)
    ground_truth = normalize_answer(ground_truth)

    return int(prediction == ground_truth)


def accuracy(predictions, ground_truths) -> float:
    if len(predictions) != len(ground_truths):
        raise ValueError(
            "Predictions and ground truths must have same length."
        )

    if len(predictions) == 0:
        return 0.0

    correct = 0

    for prediction, ground_truth in zip(
        predictions,
        ground_truths
    ):
        correct += exact_match(
            prediction,
            ground_truth
        )

    return correct / len(predictions)