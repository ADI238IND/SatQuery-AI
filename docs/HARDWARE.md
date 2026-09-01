# Hardware Strategy

## Do we need a supercomputer?

No for the MVP. The project should be designed so that most engineering can be done on a normal laptop while expensive model training is delegated to a GPU workstation, Colab/Kaggle-style notebook, university lab machine, or cloud instance.

## Local laptop tasks

Good local tasks:

- Git/GitHub work,
- API and frontend development,
- small image preprocessing,
- GeoTIFF metadata/CRS work,
- small model inference if memory allows,
- routing and EvidenceFuse logic,
- unit tests,
- evaluation scripts,
- tiny subset experiments.

## GPU tasks

Use a stronger GPU for:

- VLM fine-tuning,
- high-resolution batch inference,
- training segmentation/change models,
- optical–SAR fusion experiments,
- large-scale evaluation.

## Memory-saving methods

- LoRA/QLoRA,
- 4-bit/8-bit quantization where supported,
- mixed precision,
- gradient accumulation,
- frozen encoders,
- smaller crops/tiles,
- precomputed embeddings,
- batch size 1 with accumulation for large models.

## Storage

Satellite imagery grows quickly. Keep the Git repository small. Store datasets/checkpoints outside Git and version them using manifests plus hashes/metadata.
