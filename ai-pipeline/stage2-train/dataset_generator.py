#!/usr/bin/env python3
"""
Pramaan AI - Stage 2 Dataset Generator & Training Data Pipeline
Ingests training data from Training_Data:
1. IndicLegalQA Dataset (10,000+ Indian Supreme Court & High Court QA records)
2. Legal Agreements & Deeds (docum.pdf, legaldoc.pdf)
3. Pramaan Digital Evidence & Chain-of-Custody Records (BNS, BNSS, BSA 2023)
4. Anti-Hallucination Adversarial Negatives (Strict Refusal Safeguards)

Outputs standardized ChatML / ShareGPT JSONL files for Qwen 2.5 7B instruction fine-tuning.
"""

import os
import sys
import json
import random
import argparse
from typing import List, Dict, Tuple

try:
    import pypdf
except ImportError:
    pypdf = None

SYSTEM_PROMPT = (
    "You are Pramaan AI, an evidence-grounded legal assistant operating under the "
    "Bharatiya Sakshya Adhiniyam, 2023 (BSA) and Bharatiya Nyaya Sanhita (BNS). "
    "You answer strictly using provided evidence exhibits and verified legal records. "
    "If the requested information is not established in the evidence, state: "
    "'NO VERIFIED EVIDENCE FOUND IN CUSTODY RECORDS.'"
)

# Core Pramaan statutory & digital forensic training anchors
PRAMAAN_CORE_EVIDENCE_PAIRS = [
    {
        "system": SYSTEM_PROMPT,
        "user": (
            "Context:\n[EXHIBIT 1] FIR No. 402/2026. Jurisdiction: Chennai Central. "
            "Sections: BNS Section 70, BNS Section 351. Complainant reports suspect followed "
            "her on motorcycle registration TN-09-CB-4492 near Pondy Bazaar.\n\n"
            "Query: What statutory sections and motorcycle registration are recorded in the FIR?"
        ),
        "assistant": (
            "Based on [EXHIBIT 1] (FIR No. 402/2026), the recorded statutory sections are "
            "BNS Section 70 and BNS Section 351. The identified motorcycle registration number is TN-09-CB-4492."
        )
    },
    {
        "system": SYSTEM_PROMPT,
        "user": (
            "Context:\n[EXHIBIT 2] FSL Digital Examination Report FSL-CHN-CY-2026-8812. "
            "Storage Hash SHA-256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855. "
            "Recovered deleted WhatsApp chat logs from mobile handset iPhone 13.\n\n"
            "Query: Has the suspect admitted to financial embezzlement in the forensic report?"
        ),
        "assistant": (
            "NO VERIFIED EVIDENCE FOUND IN CUSTODY RECORDS. [EXHIBIT 2] confirms the recovery of "
            "deleted chat logs from the mobile handset, but contains no mention or admission of financial embezzlement."
        )
    },
    {
        "system": SYSTEM_PROMPT,
        "user": (
            "Context:\n[EXHIBIT 3] DEPOSITION OF WITNESS Smt. Lakshmi R. recorded under Section 180 BNSS. "
            "Witness affirms seeing suspect loitering near the commercial complex between 21:30 and 22:30 hrs.\n\n"
            "Query: Under which statutory section was the witness deposition recorded?"
        ),
        "assistant": (
            "According to [EXHIBIT 3], the witness deposition was recorded under Section 180 of the "
            "Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023."
        )
    },
    {
        "system": SYSTEM_PROMPT,
        "user": (
            "Context:\n[EXHIBIT 4] CERTIFICATE UNDER SECTION 63 BSA, 2023. Digital surveillance footage "
            "from Camera Pole #14, T. Nagar. SHA-256: 8f4e2b1c9d7a6e5f3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a. "
            "System hash matches Genesis Validator ledger block #12.\n\n"
            "Query: Does the electronic CCTV footage comply with Section 63 BSA criteria for electronic records admissibility?"
        ),
        "assistant": (
            "Yes. [EXHIBIT 4] satisfies the conditions of Section 63 of the Bharatiya Sakshya Adhiniyam, 2023. "
            "The surveillance footage from Camera Pole #14 is accompanied by a statutory certificate and its "
            "cryptographic SHA-256 hash is anchored immutably in Genesis Validator ledger block #12."
        )
    },
    {
        "system": SYSTEM_PROMPT,
        "user": (
            "Context:\n[EXHIBIT 5] CHARGE SHEET PRE-FILING AUDIT for Case TN-2026-001245. "
            "Requirements completed: FSL Report (VERIFIED), Witness Deposition (FILED). "
            "Requirement missing: Supervisory ACP Endorsement (PENDING).\n\n"
            "Query: Can the Investigation Officer file the charge sheet in court immediately?"
        ),
        "assistant": (
            "No. Under [EXHIBIT 5], the charge sheet cannot be filed. Section 193 BNSS pre-filing workflow requires "
            "all mandatory prerequisites to be satisfied. The Supervisory ACP Endorsement remains PENDING, and filing "
            "is blocked by the system until digital endorsement is secured."
        )
    }
]

# Adversarial negative query templates for anti-hallucination guardrails
UNSUPPORTED_TOPICS = [
    ("suspect's blood group and medical history", "medical examination or blood group records"),
    ("bank account balance and financial transactions", "banking or financial transaction ledgers"),
    ("overseas passport details and travel visa records", "immigration or passport verification records"),
    ("educational qualifications and university degree", "academic certificates or educational verification records"),
    ("political party affiliation and voting history", "political membership or voter enrollment records"),
]

def load_indic_legal_qa(file_path: str, max_samples: int = 1000) -> List[Dict]:
    """Loads and formats QA pairs from IndicLegalQA Dataset_10K.json."""
    if not os.path.exists(file_path):
        print(f"Warning: IndicLegalQA file not found at {file_path}")
        return []

    print(f"Loading IndicLegalQA dataset from: {file_path}")
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    print(f"Loaded {len(data)} records from IndicLegalQA.")
    
    # Deterministic sample for reproducibility
    random.seed(42)
    selected_samples = random.sample(data, min(max_samples, len(data)))
    
    records = []
    for i, item in enumerate(selected_samples):
        case_name = item.get("case_name", "").strip()
        judgment_date = item.get("judgment_date", "").strip()
        question = item.get("question", "").strip()
        answer = item.get("answer", "").strip()

        if not (case_name and question and answer):
            continue

        # Grounded factual pair
        context_str = f"[CASE RECORD: {case_name}]\nJudgment Date: {judgment_date}"
        user_prompt = f"Context:\n{context_str}\n\nQuery: {question}"
        assistant_resp = f"According to [CASE RECORD: {case_name}] ({judgment_date}), {answer}"

        records.append({
            "system": SYSTEM_PROMPT,
            "user": user_prompt,
            "assistant": assistant_resp
        })

        # Inject adversarial negative pair every 7th record (approx 14% anti-hallucination rate)
        if i % 7 == 0:
            unsupported_q, unsupported_desc = UNSUPPORTED_TOPICS[i % len(UNSUPPORTED_TOPICS)]
            neg_user_prompt = (
                f"Context:\n{context_str}\n\n"
                f"Query: What is recorded in this judgment regarding the {unsupported_q}?"
            )
            neg_assistant_resp = (
                f"NO VERIFIED EVIDENCE FOUND IN CUSTODY RECORDS. The record for [CASE RECORD: {case_name}] "
                f"contains no information regarding {unsupported_desc}."
            )
            records.append({
                "system": SYSTEM_PROMPT,
                "user": neg_user_prompt,
                "assistant": neg_assistant_resp
            })

    print(f"Processed {len(records)} training pairs from IndicLegalQA (including negative guards).")
    return records


def extract_legal_pdf_qa(pdf_path: str, max_pages: int = 50) -> List[Dict]:
    """Extracts statutory clauses, agreements, and definitions from legal PDFs."""
    if not pypdf or not os.path.exists(pdf_path):
        print(f"Skipping PDF extraction: pypdf installed={bool(pypdf)}, file exists={os.path.exists(pdf_path)}")
        return []

    doc_name = os.path.basename(pdf_path)
    print(f"Extracting legal document clauses from: {doc_name}")
    reader = pypdf.PdfReader(pdf_path)
    num_pages = min(len(reader.pages), max_pages)

    extracted_pairs = []
    for page_idx in range(num_pages):
        text = reader.pages[page_idx].extract_text() or ""
        lines = [l.strip() for l in text.split("\n") if l.strip()]

        # Identify headings or Q&A structures
        for i, line in enumerate(lines):
            if (line.startswith("What is") or line.startswith("Why is") or line.startswith("Important clauses")) and len(line) < 120:
                # Capture subsequent paragraphs as the answer
                explanation = " ".join(lines[i+1:i+6])
                if len(explanation) > 60:
                    topic = line.replace("What is", "").replace("Why is", "").replace("?", "").strip()
                    user_prompt = (
                        f"Context:\n[LEGAL DOCUMENT: {doc_name}, Page {page_idx+1}]\n"
                        f"Excerpt: {line}\n{explanation[:400]}\n\n"
                        f"Query: What are the statutory definitions and requirements regarding {topic}?"
                    )
                    assistant_resp = (
                        f"Based on [LEGAL DOCUMENT: {doc_name}], {explanation[:350]}."
                    )
                    extracted_pairs.append({
                        "system": SYSTEM_PROMPT,
                        "user": user_prompt,
                        "assistant": assistant_resp
                    })

    print(f"Extracted {len(extracted_pairs)} clause Q&A pairs from {doc_name}.")
    return extracted_pairs


def generate_datasets(training_data_dir: str = "Training_Data", output_dir: str = "ai-pipeline/stage2-train/data"):
    """Orchestrates dataset creation, ChatML formatting, and split partitioning."""
    os.makedirs(output_dir, exist_ok=True)
    train_file = os.path.join(output_dir, "pramaan_evidence_train.jsonl")
    eval_file = os.path.join(output_dir, "pramaan_evidence_eval.jsonl")

    all_pairs: List[Dict] = []

    # 1. Add core Pramaan custody & evidence pairs
    all_pairs.extend(PRAMAAN_CORE_EVIDENCE_PAIRS)

    # 2. Add IndicLegalQA records
    qa_path = os.path.join(training_data_dir, "IndicLegalQA Dataset_10K.json")
    if not os.path.exists(qa_path):
        # Fallback to local search
        qa_path = "Training_Data/IndicLegalQA Dataset_10K.json"
    qa_pairs = load_indic_legal_qa(qa_path, max_samples=1000)
    all_pairs.extend(qa_pairs)

    # 3. Add legal deed & agreement clauses from PDFs
    for pdf_name in ["docum.pdf", "legaldoc.pdf"]:
        pdf_path = os.path.join(training_data_dir, pdf_name)
        if not os.path.exists(pdf_path):
            pdf_path = os.path.join("Training_Data", pdf_name)
        pdf_pairs = extract_legal_pdf_qa(pdf_path, max_pages=40)
        all_pairs.extend(pdf_pairs)

    print(f"\nTotal curated dataset size: {len(all_pairs)} records.")

    # Shuffle deterministically
    random.seed(42)
    random.shuffle(all_pairs)

    # Convert to ChatML structure
    chatml_records = []
    for pair in all_pairs:
        chatml_records.append({
            "messages": [
                {"role": "system", "content": pair["system"]},
                {"role": "user", "content": pair["user"]},
                {"role": "assistant", "content": pair["assistant"]}
            ]
        })

    # Train / Eval Split (85% Train, 15% Eval)
    split_idx = int(len(chatml_records) * 0.85)
    train_split = chatml_records[:split_idx]
    eval_split = chatml_records[split_idx:]

    # Write training split
    with open(train_file, "w", encoding="utf-8") as f:
        for rec in train_split:
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")

    # Write evaluation split
    with open(eval_file, "w", encoding="utf-8") as f:
        for rec in eval_split:
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")

    print(f"\nDataset Generation Complete:")
    print(f"  * Training Split:   {len(train_split)} records -> {train_file}")
    print(f"  * Evaluation Split: {len(eval_split)} records -> {eval_file}")
    print(f"  * Schema Format:    ChatML / ShareGPT ({train_split[0]['messages'][0]['role']}/{train_split[0]['messages'][1]['role']}/{train_split[0]['messages'][2]['role']})")
    return train_file, eval_file


def validate_dataset(data_dir: str = "ai-pipeline/stage2-train/data"):
    """Performs strict schema and quality validation on the generated jsonl files."""
    train_file = os.path.join(data_dir, "pramaan_evidence_train.jsonl")
    eval_file = os.path.join(data_dir, "pramaan_evidence_eval.jsonl")

    for fpath in [train_file, eval_file]:
        if not os.path.exists(fpath):
            print(f"FAIL: File does not exist: {fpath}")
            sys.exit(1)

        print(f"Validating: {fpath}...")
        count = 0
        anti_hallucination_count = 0
        with open(fpath, "r", encoding="utf-8") as f:
            for line_idx, line in enumerate(f):
                try:
                    record = json.loads(line)
                except json.JSONDecodeError as e:
                    print(f"FAIL: Invalid JSON on line {line_idx+1} in {fpath}: {e}")
                    sys.exit(1)

                assert "messages" in record, f"Line {line_idx+1}: missing 'messages' key"
                msgs = record["messages"]
                assert len(msgs) == 3, f"Line {line_idx+1}: expected 3 messages, got {len(msgs)}"
                assert msgs[0]["role"] == "system" and len(msgs[0]["content"]) > 20
                assert msgs[1]["role"] == "user" and len(msgs[1]["content"]) > 10
                assert msgs[2]["role"] == "assistant" and len(msgs[2]["content"]) > 5

                if "NO VERIFIED EVIDENCE FOUND" in msgs[2]["content"]:
                    anti_hallucination_count += 1
                count += 1

        print(f"PASS: {count} records validated in {os.path.basename(fpath)}. "
              f"Anti-hallucination negative checks: {anti_hallucination_count}")

    print("\nALL DATASET VALIDATION CHECKS PASSED.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Pramaan Stage 2 Dataset Generator")
    parser.add_argument("--input-dir", default="Training_Data", help="Directory containing IndicLegalQA and PDFs")
    parser.add_argument("--output-dir", default="ai-pipeline/stage2-train/data", help="Output directory for JSONL splits")
    parser.add_argument("--validate", action="store_true", help="Validate existing dataset schema")
    args = parser.parse_args()

    if args.validate:
        validate_dataset(args.output_dir)
    else:
        generate_datasets(args.input_dir, args.output_dir)
        validate_dataset(args.output_dir)
