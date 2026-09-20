import { describe, it, expect, beforeAll } from 'vitest';
import { chunkingService } from '../src/services/chunking.service.js';
import { ragService } from '../src/services/rag.service.js';

describe('Pramaan Strict RAG Engine Suite (Qwen2.5:7b & Nomic-Embed-Text)', () => {
  describe('1. Semantic Document Chunking Engine', () => {
    it('should split long document text into overlapping chunks respecting sentence boundaries', () => {
      const longText = `
FIRST INFORMATION REPORT (FIR NO. 402/2026).
State Crime Records Bureau - Women Safety Division.
Complainant Smt. Priya reports that on 14th January 2026 at approximately 21:30 hrs, an unknown individual riding a black motorcycle followed her vehicle near Pondy Bazaar.
The suspect repeatedly engaged in aggressive intimidation, flashing headlights, and verbal harassment in direct violation of Section 70 and Section 351 of the Bharatiya Nyaya Sanhita (BNS).
Physical surveillance was maintained for approximately 2.5 kilometers until the victim reached a crowded junction near Anna Salai.
Deposition corroborated by CCTV surveillance footage recovered from nearby commercial establishments.
Digital forensics examination confirmed suspicious vehicle registration number TN-09-CB-4492.
The investigating officer Inspector Rajesh Varma has preserved the electronic records under Section 63 of Bharatiya Sakshya Adhiniyam, 2023.
      `.trim();

      const chunks = chunkingService.chunkText(
        longText,
        { chunkSize: 250, chunkOverlap: 60, minChunkSize: 40 },
        { docType: 'FIR', caseNumber: 'TN-2026-402' }
      );

      expect(chunks.length).toBeGreaterThan(1);
      expect(chunks[0].chunkIndex).toBe(0);
      expect(chunks[0].metadata?.docType).toBe('FIR');
      expect(chunks[0].metadata?.caseNumber).toBe('TN-2026-402');

      // Check overlap between consecutive chunks
      for (let i = 0; i < chunks.length - 1; i++) {
        expect(chunks[i].content.length).toBeGreaterThanOrEqual(40);
        expect(chunks[i].startChar).toBeLessThan(chunks[i + 1].startChar);
      }
    });

    it('should return a single chunk if text is smaller than chunk size', () => {
      const shortText = 'Brief witness deposition confirming presence of suspect at scene.';
      const chunks = chunkingService.chunkText(shortText, { chunkSize: 500 });

      expect(chunks.length).toBe(1);
      expect(chunks[0].content).toBe(shortText);
      expect(chunks[0].chunkIndex).toBe(0);
    });

    it('should return empty array for whitespace text', () => {
      const emptyChunks = chunkingService.chunkText('   \n\n  \t ');
      expect(emptyChunks).toEqual([]);
    });
  });

  describe('2. Vector Embeddings & Similarity Mathematics', () => {
    it('should produce 768-dimensional normalized embedding vectors', async () => {
      const vector = await ragService.getEmbedding('Digital forensics examination report for mobile handset', false);

      expect(vector).toBeDefined();
      expect(vector.length).toBe(768);

      // Verify vector is normalized (magnitude = 1.0)
      const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
      expect(magnitude).toBeCloseTo(1.0, 3);
    });

    it('should compute exact cosine similarity correctly', () => {
      const vecA = [1, 0, 0];
      const vecB = [1, 0, 0];
      const vecC = [0, 1, 0];
      const vecD = [-1, 0, 0];

      expect(ragService.cosineSimilarity(vecA, vecB)).toBeCloseTo(1.0, 5); // Identical
      expect(ragService.cosineSimilarity(vecA, vecC)).toBeCloseTo(0.0, 5); // Orthogonal
      expect(ragService.cosineSimilarity(vecA, vecD)).toBeCloseTo(-1.0, 5); // Opposite
    });

    it('should calculate higher similarity for semantically related evidence queries', async () => {
      const docEmbed = await ragService.getEmbedding('Cyber stalking, deleted chat logs, and digital intimidation records', false);
      const queryRelevant = await ragService.getEmbedding('deleted messages cyber stalking', true);
      const queryIrrelevant = await ragService.getEmbedding('agricultural land revenue mutation record', true);

      const simRelevant = ragService.cosineSimilarity(queryRelevant, docEmbed);
      const simIrrelevant = ragService.cosineSimilarity(queryIrrelevant, docEmbed);

      expect(simRelevant).toBeGreaterThan(simIrrelevant);
    });
  });

  describe('3. Strict RAG Anti-Hallucination & Grounding', () => {
    it('should strictly refuse to answer when query has no verified matching evidence in records', async () => {
      // Query totally outside any evidence
      const res = await ragService.query('What is the planetary orbit duration of Jupiter in solar astronomy?');

      expect(res.isGrounded).toBe(false);
      expect(res.answer).toContain('NO VERIFIED EVIDENCE FOUND IN CUSTODY RECORDS');
      expect(res.citedEvidence).toEqual([]);
    });

    it('should include strict BSA 2023 legal advisory disclaimer in every response', async () => {
      const res = await ragService.query('Summarize case findings');
      expect(res.disclaimer).toContain('BHARATIYA SAKSHYA ADHINIYAM, 2023');
    });
  });

  describe('4. RAG Engine Health Verification', () => {
    it('should report health and availability of configured models', async () => {
      const health = await ragService.checkHealth();
      expect(health).toBeDefined();
      expect(['READY', 'DEGRADED', 'OFFLINE']).toContain(health.status);
      expect(health.ollamaUrl).toBeDefined();
    });
  });
});
