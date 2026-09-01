# Study Guide

## 1. Remote sensing and GIS

Learn first:

- raster vs vector data,
- pixel size / ground sampling distance,
- spectral bands,
- optical vs multispectral vs SAR,
- CRS, EPSG codes and reprojection,
- GeoTIFF metadata,
- resampling,
- map projections,
- tiling and mosaics,
- image registration/coregistration,
- cloud masks and nodata.

Tools/libraries: QGIS for inspection; Rasterio, GDAL concepts, GeoPandas, Shapely and PyProj in Python.

## 2. Maths

Priority topics:

- vectors and matrices,
- matrix multiplication,
- dot products and cosine similarity,
- probability and conditional probability,
- mean/variance/covariance,
- distributions and confidence/calibration,
- gradients and optimization,
- cross-entropy,
- precision/recall/F1/IoU,
- basic geometry for bounding boxes and masks.

## 3. Deep learning

Study in this order:

1. PyTorch tensors/autograd.
2. CNNs and feature maps.
3. Segmentation (U-Net-style concepts).
4. Vision Transformers.
5. Attention and transformers.
6. Contrastive/multimodal representation learning.
7. Vision-language models.
8. Parameter-efficient fine-tuning: LoRA/QLoRA.
9. Calibration and uncertainty.

## 4. Change detection

Understand:

- Siamese encoders,
- feature differencing,
- early vs late fusion,
- change masks,
- temporal attention,
- change captioning / interactive change QA.

## 5. SAR essentials

You do not need to become a SAR physicist before coding, but understand:

- backscatter intuition,
- amplitude/intensity,
- speckle,
- polarization,
- incidence-angle effects,
- why SAR can observe through clouds and at night,
- why optical-style color assumptions do not transfer directly.

## 6. Software / MLOps

- Git/GitHub branches and pull requests,
- FastAPI,
- Pydantic schemas,
- experiment tracking,
- reproducible configs,
- Docker later if useful,
- unit tests for non-ML logic.
