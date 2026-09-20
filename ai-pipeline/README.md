# Pramaan AI Subsystem: Strict RAG & Stage 2 Training Pipeline

This directory contains the architecture, evaluation benchmarks, and fine-tuning harness for Pramaan's AI subsystem, operating strictly under the **Bharatiya Sakshya Adhiniyam, 2023 (BSA)** and **Bharatiya Nyaya Sanhita (BNS)**.

---

## 1. Stage 1: Production Strict RAG Architecture

The Pramaan application strictly enforces **Zero-Hallucination Retrieval-Augmented Generation (RAG)**:
- **Embedding Model**: `nomic-embed-text` (768-dimensional normalized dense vectors, using task prefixes `search_document: ` for exhibit chunks and `search_query: ` for investigative inquiries).
- **Chunking Engine**: Sliding-window semantic chunker (`chunking.service.ts`) with sentence boundary preservation, 500-character target chunk size, and 100-character overlap.
- **Generator LLM**: `qwen2.5:7b` (Alibaba Cloud Qwen 2.5 7B Instruct) queried at low temperature (0.1) with strict system instructions:
  - Answers **strictly and only** from provided verified evidence chunks.
  - Refuses non-grounded questions with `"NO VERIFIED EVIDENCE FOUND IN CUSTODY RECORDS"`.
  - Cites Exhibit Title, Document Type, and cryptographic SHA-256 hash for every statement.

### Quick Start with Docker
To spin up the entire stack including the Ollama container:
```powershell
docker compose up -d
```

Pull the required models in Ollama (or run locally):
```bash
ollama pull qwen2.5:7b
ollama pull nomic-embed-text
```

---

## 2. Automated AI CI/CD Pipeline

Pramaan includes an integrated AI CI/CD pipeline (`.github/workflows/ai-rag-ci-cd.yml`) and local runner:

### Running the AI Pipeline Locally
```bash
cd server
npm run ai:ci-cd
```

### Pipeline Verification Stages:
1. **Stage 1 (Chunking Integrity)**: Verifies sentence boundary preservation, token counts, and chunk indexing.
2. **Stage 2 (Vector Embedding)**: Asserts 768-dimension vector output and unit normalization (`||v|| = 1.0`).
3. **Stage 3 (RAG Grounding & Refusal Gate)**: Tests golden legal benchmark queries, semantic ranking precision, and anti-hallucination refusal.
4. **Stage 4 (Service Gate)**: Evaluates Ollama latency and model readiness.
5. **Stage 5 (Stage-2 Training Ready)**: Validates ChatML/ShareGPT schema compliance for Stage 2 fine-tuning.

---

## 3. Stage 2: Model Fine-Tuning & Testing Harness

For Stage 2 domain specialization (training Qwen 2.5 7B directly on Indian judicial evidence synthesis, BNS classification, and charge-sheet drafting):

### Directory Structure
```
ai-pipeline/stage2-train/
├── training_config.yaml   # Hyperparameters, LoRA rank (16), alpha (32), 4-bit NF4
├── dataset_generator.py   # Generates ChatML training data from evidence records
├── train_qwen2_5.py       # QLoRA fine-tuning script with PyTorch & PEFT
└── eval_qwen2_5.py        # Evaluation benchmark measuring grounding score & citation fidelity
```

### Step 1: Generate Training Data
```bash
python ai-pipeline/stage2-train/dataset_generator.py
```

### Step 2: Launch QLoRA Fine-Tuning
On an Nvidia GPU (16GB+ VRAM or Google Colab T4/A100):
```bash
python ai-pipeline/stage2-train/train_qwen2_5.py --config ai-pipeline/stage2-train/training_config.yaml
```
*(Use `--dry-run` to test configuration on CPU).*

### Step 3: Run Evaluation Benchmark
```bash
python ai-pipeline/stage2-train/eval_qwen2_5.py --weights ./output/qwen2.5-7b-pramaan-lora
```

### Step 4: Export to Ollama
Once fine-tuned, convert the LoRA weights to GGUF format and create an Ollama Modelfile:
```dockerfile
FROM qwen2.5:7b
ADAPTER ./output/qwen2.5-7b-pramaan-lora
PARAMETER temperature 0.1
PARAMETER top_p 0.8
SYSTEM "You are Pramaan AI, operating strictly under the Bharatiya Sakshya Adhiniyam, 2023."
```
Register the model with:
```bash
ollama create qwen2.5:7b-pramaan -f Modelfile
```
Update `LLM_MODEL=qwen2.5:7b-pramaan` in `.env`.
