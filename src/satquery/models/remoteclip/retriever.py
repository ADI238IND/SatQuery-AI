"""Text-to-image retrieval over a saved RemoteCLIP embedding index."""

from pathlib import Path

import torch


class RemoteCLIPRetriever:
    def __init__(self, model, index_path: str | Path | None = None) -> None:
        self.model = model
        self.image_embeddings: torch.Tensor | None = None
        self.labels: torch.Tensor | None = None
        self.classes: list[str] | None = None
        self.image_paths: list[str] | None = None
        if index_path is not None:
            self.load_index(index_path)

    def load_index(self, index_path: str | Path) -> "RemoteCLIPRetriever":
        path = Path(index_path)
        if not path.is_file():
            raise FileNotFoundError(f"RemoteCLIP index not found: {path}")
        try:
            data = torch.load(path, map_location="cpu", weights_only=True)
        except TypeError:
            data = torch.load(path, map_location="cpu")

        embeddings = data.get("embeddings")
        if not isinstance(embeddings, torch.Tensor) or embeddings.ndim != 2:
            raise ValueError("Index must contain a two-dimensional 'embeddings' tensor.")
        self.image_embeddings = embeddings.float()
        self.image_embeddings /= self.image_embeddings.norm(
            dim=-1, keepdim=True
        ).clamp_min(1e-12)
        self.labels = data.get("labels")
        self.classes = data.get("classes")
        self.image_paths = data.get("image_paths")
        return self

    @torch.inference_mode()
    def search(self, query: str, top_k: int = 5) -> list[dict[str, object]]:
        if self.image_embeddings is None:
            raise RuntimeError("No image index loaded.")
        if not query.strip():
            raise ValueError("Query must not be empty.")
        if top_k < 1:
            raise ValueError("top_k must be at least 1.")

        text_feature = self.model.encode_text([query]).cpu().float()
        text_feature /= text_feature.norm(dim=-1, keepdim=True).clamp_min(1e-12)
        scores = (text_feature @ self.image_embeddings.T).squeeze(0)
        values, indices = torch.topk(scores, k=min(top_k, scores.numel()))

        results = []
        for rank, (index, score) in enumerate(
            zip(indices.tolist(), values.tolist()), start=1
        ):
            result: dict[str, object] = {
                "rank": rank,
                "index": index,
                "score": float(score),
            }
            if self.image_paths is not None:
                result["image_path"] = self.image_paths[index]
            if self.labels is not None:
                label_index = int(self.labels[index])
                result["label_index"] = label_index
                if self.classes is not None:
                    result["label"] = self.classes[label_index]
            results.append(result)
        return results
