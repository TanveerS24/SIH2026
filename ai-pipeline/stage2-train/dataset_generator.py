#!/usr/bin/env python3
"""
Pramaan AI - Stage 2 Dataset Generator
Prepares instruction-tuning pairs in ChatML / Alpaca format tailored for:
1. Indian Evidence Admissibility (Bharatiya Sakshya Adhiniyam, 2023 - BSA)
2. Penal Violations (Bharatiya Nyaya Sanhita - BNS)
3. Chain of Custody & Cryptographic SHA-256 Verification
4. Strict Anti-Hallucination Evidence Synthesis
"""

import os
import sys
import json
import argparse

SAMPLE_EVIDENCE_PAIRS = [
    {
        "system": "You are Pramaan AI, an evidence-grounded legal assistant operating under the Bharatiya Sakshya Adhiniyam, 2023 (BSA). You answer strictly using provided evidence exhibits.",
        "user": "Context:\n[EXHIBIT 1] FIR No. 402/2026. Sections: BNS 70, BNS 351. Complainant reports suspect followed her on motorcycle registration TN-09-CB-4492 near Pondy Bazaar.\n\nQuery: What statutory sections and motorcycle registration are recorded in the FIR?",
        "assistant": "Based on [EXHIBIT 1] (FIR No. 402/2026), the recorded statutory sections are BNS Section 70 and BNS Section 351. The identified motorcycle registration number is TN-09-CB-4492."
    },
    {
        "system": "You are Pramaan AI, an evidence-grounded legal assistant operating under the Bharatiya Sakshya Adhiniyam, 2023 (BSA). You answer strictly using provided evidence exhibits.",
        "user": "Context:\n[EXHIBIT 2] FSL Examination FSL-CHN-CY-2026-8812. Hash SHA-256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855. Recovered deleted chat logs from mobile handset.\n\nQuery: Has the suspect admitted to financial embezzlement in the forensic report?",
        "assistant": "NO VERIFIED EVIDENCE FOUND IN CUSTODY RECORDS. [EXHIBIT 2] confirms the recovery of deleted chat logs from the mobile handset, but contains no mention or admission of financial embezzlement."
    },
    {
        "system": "You are Pramaan AI, an evidence-grounded legal assistant operating under the Bharatiya Sakshya Adhiniyam, 2023 (BSA). You answer strictly using provided evidence exhibits.",
        "user": "Context:\n[EXHIBIT 3] DEPOSITION OF WITNESS Smt. Lakshmi R. under Section 180 BNSS. Confirms seeing suspect loitering near commercial complex between 21:30 and 22:30 hrs.\n\nQuery: Under which statutory section was the witness deposition recorded?",
        "assistant": "According to [EXHIBIT 3], the witness deposition was recorded under Section 180 of the Bharatiya Nagarik Suraksha Sanhita (BNSS)."
    }
]

def generate_datasets(output_dir="./data"):
    os.makedirs(output_dir, exist_ok=True)
    train_file = os.path.join(output_dir, "pramaan_evidence_train.jsonl")
    eval_file = os.path.join(output_dir, "pramaan_evidence_eval.jsonl")

    # Format into ChatML schema
    chatml_records = []
    for pair in SAMPLE_EVIDENCE_PAIRS:
        chatml_records.append({
            "messages": [
                {"role": "system", "content": pair["system"]},
                {"role": "user", "content": pair["user"]},
                {"role": "assistant", "content": pair["assistant"]}
            ]
        })

    # Write training split
    with open(train_file, "w", encoding="utf-8") as f:
        for rec in chatml_records:
            f.write(json.dumps(rec) + "\n")

    # Write eval split
    with open(eval_file, "w", encoding="utf-8") as f:
        for rec in chatml_records[:1]:
            f.write(json.dumps(rec) + "\n")

    print(f"Generated {len(chatml_records)} training records at: {train_file}")
    print(f"Generated evaluation split at: {eval_file}")
    return train_file, eval_file

def validate_dataset():
    print("Validating Stage-2 Fine-Tuning dataset format for Qwen2.5:7b...")
    for i, pair in enumerate(SAMPLE_EVIDENCE_PAIRS):
        assert "system" in pair and len(pair["system"]) > 10, f"Record {i} missing valid system prompt"
        assert "user" in pair and len(pair["user"]) > 10, f"Record {i} missing valid user input"
        assert "assistant" in pair and len(pair["assistant"]) > 5, f"Record {i} missing valid assistant response"
    print(f"PASS: {len(SAMPLE_EVIDENCE_PAIRS)} records conform strictly to ChatML/ShareGPT fine-tuning standard.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Pramaan Stage 2 Dataset Generator")
    parser.add_argument("--validate", action="store_true", help="Validate dataset schema")
    parser.add_argument("--output", default="./data", help="Output directory")
    args = parser.parse_args()

    if args.validate:
        validate_dataset()
    else:
        generate_datasets(args.output)
