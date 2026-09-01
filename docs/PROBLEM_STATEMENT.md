# Problem Statement

## Official identity

- **PS Number:** SIH26167
- **Organization:** Indian Space Research Organisation (ISRO)
- **Theme:** Space Technology
- **Title:** **SatQuery AI – An Interactive Vision-Language Assistant for Multimodal Remote Sensing Image Analysis through Text Queries**

## Problem in simple language

Remote-sensing imagery is extremely useful, but extracting information from it normally requires GIS knowledge, sensor knowledge, preprocessing, band selection, coordinate systems, model selection and manual measurements.

SatQuery AI should hide most of that complexity. A user asks a normal question; the system determines what imagery and analysis are needed, runs the relevant pipeline, and returns an understandable answer with visual evidence.

## What we are trying to improve

We are not trying to replace every GIS tool. We are trying to make common analytical questions much easier to ask and verify.

The improvement is from:

> “Open a GIS tool, understand the sensor, prepare the imagery, choose an algorithm, run analysis, inspect layers and calculate a result.”

To:

> “Upload/select imagery, ask a question, inspect the grounded answer and evidence.”

## Functional scope used in this repository

1. Single-image VQA.
2. Captioning and visual grounding.
3. Bi-temporal change analysis.
4. Optical–SAR multimodal reasoning.
5. Model/tool orchestration.

## Product principles

- **Natural-language first** – no GIS expertise required for basic use.
- **Evidence over fluent text** – prefer masks, boxes, regions and measurements over unsupported prose.
- **Specialists over one giant model** – use task-specific models when they are more reliable.
- **Sensor awareness** – optical and SAR have different failure modes.
- **Abstention is a feature** – “insufficient evidence” is better than a confident hallucination.
- **Human inspectability** – every important result should expose the evidence that produced it.
