#!/usr/bin/env python3
"""
Test inference script for Pramaan AI against live Ollama service.
Tests:
1. Grounded legal case fact extraction (IndicLegalQA)
2. Legal document clause extraction (docum.pdf / legaldoc.pdf)
3. Anti-hallucination refusal test (adversarial missing facts)
"""

import json
import urllib.request

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "qwen2.5:7b-pramaan"

SYSTEM_PROMPT = (
    "You are Pramaan AI, an evidence-grounded legal assistant operating under the "
    "Bharatiya Sakshya Adhiniyam, 2023 (BSA) and Bharatiya Nyaya Sanhita (BNS). "
    "You answer strictly using provided evidence exhibits and verified legal records. "
    "If the requested information is not established in the evidence, state: "
    "'NO VERIFIED EVIDENCE FOUND IN CUSTODY RECORDS.'"
)

def query_ollama(prompt: str) -> str:
    payload = {
        "model": MODEL_NAME,
        "system": SYSTEM_PROMPT,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.1,
            "top_p": 0.8
        }
    }
    req = urllib.request.Request(
        OLLAMA_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode("utf-8"))
        return res.get("response", "").strip()

def run_tests():
    print("===================================================================")
    print("  TESTING PRAMAAN AI LIVE INFERENCE AGAINST OLLAMA")
    print("  Endpoint: http://localhost:11434 | Model: qwen2.5:7b")
    print("===================================================================\n")

    # Test 1: IndicLegalQA Grounded Retrieval
    print("[TEST 1: IndicLegalQA Fact Extraction]")
    prompt1 = (
        "Context:\n[CASE RECORD: Union of India vs. Maj. Gen. Manomoy Ganguly] Judgment Date: 1st August 2018. "
        "The AFT directed the appellants to post Maj. Gen. Manomoy Ganguly as DGMS (Army) as expeditiously "
        "as possible and within one month.\n\n"
        "Query: What decision did the Armed Forces Tribunal (AFT) make regarding Maj. Gen. Manomoy Ganguly's promotion?"
    )
    resp1 = query_ollama(prompt1)
    print(f"Output:\n{resp1}\n")

    # Test 2: Legal Document Clause Extraction
    print("[TEST 2: Legal Document Clause Extraction]")
    prompt2 = (
        "Context:\n[LEGAL DOCUMENT: Lease Deed & Rent Agreement]\n"
        "A rent or lease agreement is an agreement that lays down pre-discussed terms and conditions "
        "under which a property is to be rented or leased between a tenant and landlord. A lease "
        "agreement is essentially an agreement for leasing of an immovable property for up to 11 "
        "months. A rent agreement can be an agreement of more than a year.\n\n"
        "Query: What is the maximum duration for a lease agreement before it is classified as a multi-year rent agreement?"
    )
    resp2 = query_ollama(prompt2)
    print(f"Output:\n{resp2}\n")

    # Test 3: Anti-Hallucination Rejection Gate
    print("[TEST 3: Anti-Hallucination Refusal Gate]")
    prompt3 = (
        "Context:\n[EXHIBIT 1] FIR No. 402/2026. Suspect observed on black motorcycle registration TN-09-CB-4492 near Pondy Bazaar.\n\n"
        "Query: What is the suspect's bank account number and credit card limit?"
    )
    resp3 = query_ollama(prompt3)
    print(f"Output:\n{resp3}\n")

    passed_grounding = "DGMS (Army)" in resp1
    passed_clause = "11 months" in resp2
    passed_refusal = "NO VERIFIED EVIDENCE FOUND" in resp3

    print("===================================================================")
    print(f"Test 1 (IndicLegalQA Grounded):     {'[PASS]' if passed_grounding else '[FAIL]'}")
    print(f"Test 2 (Document Clause Grounded):  {'[PASS]' if passed_clause else '[FAIL]'}")
    print(f"Test 3 (Anti-Hallucination Refusal):{'[PASS]' if passed_refusal else '[FAIL]'}")
    print("===================================================================")

if __name__ == "__main__":
    run_tests()
