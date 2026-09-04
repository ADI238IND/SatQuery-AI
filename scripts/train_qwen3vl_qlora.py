
import json
from pathlib import Path
from PIL import Image

import torch
from datasets import Dataset
from transformers import (
    AutoProcessor,
    AutoModelForImageTextToText,
    BitsAndBytesConfig,
    TrainingArguments,
    Trainer
)
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from qwen_vl_utils import process_vision_info

MODEL_ID = "Qwen/Qwen3-VL-2B-Instruct"

REPO = Path("/content/SatQuery-AI")

TRAIN_FILE = (
    REPO
    / "data"
    / "training"
    / "vrsbench_vqa_train_5000.jsonl"
)

IMAGE_DIR = (
    REPO
    / "data"
    / "training"
    / "images"
)

OUTPUT_DIR = (
    REPO
    / "models"
    / "qwen3vl_vrsbench_lora"
)

OUTPUT_DIR.mkdir(
    parents=True,
    exist_ok=True
)

rows = []

with open(
    TRAIN_FILE,
    "r",
    encoding="utf-8"
) as f:
    for line in f:
        if line.strip():
            rows.append(json.loads(line))

print("Training examples:", len(rows))

missing = []

for row in rows:
    p = IMAGE_DIR / row["image"]

    if not p.exists():
        missing.append(row["image"])

if missing:
    raise FileNotFoundError(
        f"{len(set(missing))} training images are missing. "
        f"Example: {missing[:10]}"
    )

dataset = Dataset.from_list(rows)

bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.float16,
    bnb_4bit_use_double_quant=True
)

print("Loading processor...")

processor = AutoProcessor.from_pretrained(
    MODEL_ID
)

print("Loading 4-bit model...")

model = AutoModelForImageTextToText.from_pretrained(
    MODEL_ID,
    quantization_config=bnb_config,
    device_map="auto",
    torch_dtype=torch.float16
)

model = prepare_model_for_kbit_training(
    model
)

lora_config = LoraConfig(
    r=16,
    lora_alpha=32,
    lora_dropout=0.05,
    bias="none",
    target_modules=[
        "q_proj",
        "k_proj",
        "v_proj",
        "o_proj"
    ],
    task_type="CAUSAL_LM"
)

model = get_peft_model(
    model,
    lora_config
)

model.print_trainable_parameters()


def collate_fn(batch):

    texts = []
    image_inputs_all = []

    for sample in batch:

        image_path = IMAGE_DIR / sample["image"]

        messages = [
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "image": str(image_path)
                    },
                    {
                        "type": "text",
                        "text": sample["question"]
                    }
                ]
            },
            {
                "role": "assistant",
                "content": [
                    {
                        "type": "text",
                        "text": sample["answer"]
                    }
                ]
            }
        ]

        text = processor.apply_chat_template(
            messages,
            tokenize=False,
            add_generation_prompt=False
        )

        image_inputs, video_inputs = process_vision_info(
            messages
        )

        texts.append(text)

        if image_inputs:
            image_inputs_all.append(
                image_inputs[0]
            )
        else:
            image_inputs_all.append(
                Image.open(image_path).convert("RGB")
            )

    model_inputs = processor(
        text=texts,
        images=image_inputs_all,
        padding=True,
        return_tensors="pt"
    )

    labels = model_inputs["input_ids"].clone()

    labels[
        model_inputs["attention_mask"] == 0
    ] = -100

    model_inputs["labels"] = labels

    return model_inputs


training_args = TrainingArguments(
    output_dir=str(OUTPUT_DIR),
    per_device_train_batch_size=1,
    gradient_accumulation_steps=8,
    num_train_epochs=1,
    learning_rate=2e-4,
    logging_steps=10,
    save_steps=250,
    save_total_limit=2,
    fp16=True,
    gradient_checkpointing=True,
    remove_unused_columns=False,
    report_to="none",
    dataloader_num_workers=0,
    optim="paged_adamw_8bit"
)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=dataset,
    data_collator=collate_fn
)

print("\nStarting QLoRA training...")

trainer.train()

print("\nSaving adapter...")

model.save_pretrained(
    OUTPUT_DIR
)

processor.save_pretrained(
    OUTPUT_DIR
)

print("\nTraining complete.")
print("Saved to:", OUTPUT_DIR)
