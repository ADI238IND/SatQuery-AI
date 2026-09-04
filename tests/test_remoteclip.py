import torch

from satquery.models.remoteclip import RemoteCLIPRetriever, RemoteCLIPZeroShotClassifier


class FakeModel:
    def encode_text(self, texts):
        vectors = {"river": [1.0, 0.0], "forest": [0.0, 1.0]}
        return torch.tensor([vectors.get(text, [1.0, 0.0]) for text in texts])

    def encode_image(self, image):
        return torch.tensor([[1.0, 0.0]])


def test_classifier_selects_highest_similarity():
    result = RemoteCLIPZeroShotClassifier(FakeModel()).predict(None, ["river", "forest"])
    assert result["label"] == "river"


def test_retriever_loads_index_and_returns_metadata(tmp_path):
    index_path = tmp_path / "index.pt"
    torch.save(
        {
            "embeddings": torch.tensor([[1.0, 0.0], [0.0, 1.0]]),
            "labels": torch.tensor([0, 1]),
            "classes": ["river", "forest"],
            "image_paths": ["river.jpg", "forest.jpg"],
        },
        index_path,
    )
    results = RemoteCLIPRetriever(FakeModel(), index_path).search("river", top_k=1)
    assert results[0]["label"] == "river"
    assert results[0]["image_path"] == "river.jpg"
