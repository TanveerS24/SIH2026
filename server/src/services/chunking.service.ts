export interface TextChunk {
  chunkIndex: number;
  content: string;
  startChar: number;
  endChar: number;
  tokenCount: number;
  metadata?: Record<string, any>;
}

export interface ChunkingOptions {
  chunkSize?: number; // Target character length per chunk (default 500)
  chunkOverlap?: number; // Overlap character length (default 100)
  minChunkSize?: number; // Discard/merge chunks smaller than this (default 80)
}

export class ChunkingService {
  /**
   * Split document text into overlapping semantic chunks with sentence-aware boundaries.
   */
  public chunkText(
    text: string,
    options: ChunkingOptions = {},
    baseMetadata: Record<string, any> = {}
  ): TextChunk[] {
    const chunkSize = Math.max(100, options.chunkSize ?? 500);
    const chunkOverlap = Math.max(0, Math.min(chunkSize - 20, options.chunkOverlap ?? 100));
    const minChunkSize = options.minChunkSize ?? 60;

    const normalized = text.replace(/\r\n/g, '\n').trim();
    if (!normalized) {
      return [];
    }

    // If text is smaller than or equal to chunkSize, return single chunk
    if (normalized.length <= chunkSize) {
      return [
        {
          chunkIndex: 0,
          content: normalized,
          startChar: 0,
          endChar: normalized.length,
          tokenCount: Math.ceil(normalized.length / 4),
          metadata: { ...baseMetadata },
        },
      ];
    }

    const chunks: TextChunk[] = [];
    let startIdx = 0;
    let chunkIndex = 0;

    while (startIdx < normalized.length) {
      let endIdx = Math.min(startIdx + chunkSize, normalized.length);

      // If not at the end of the text, try to find a natural sentence or line break
      if (endIdx < normalized.length) {
        // Look for paragraph break (\n\n), then sentence terminator (. ! ? \n), then space
        const searchWindow = normalized.substring(
          Math.max(startIdx, endIdx - 80),
          Math.min(normalized.length, endIdx + 40)
        );
        const relBase = Math.max(startIdx, endIdx - 80);

        const breakMatches = [
          searchWindow.lastIndexOf('\n\n'),
          searchWindow.lastIndexOf('.\n'),
          searchWindow.lastIndexOf('. '),
          searchWindow.lastIndexOf('?\n'),
          searchWindow.lastIndexOf('? '),
          searchWindow.lastIndexOf('!\n'),
          searchWindow.lastIndexOf('! '),
          searchWindow.lastIndexOf('\n'),
          searchWindow.lastIndexOf('; '),
        ].filter((idx) => idx > 0);

        if (breakMatches.length > 0) {
          const bestRelIdx = Math.max(...breakMatches);
          const candidateEnd = relBase + bestRelIdx + 1;
          // Ensure chunk isn't excessively small or oversized
          if (candidateEnd > startIdx + minChunkSize && candidateEnd <= startIdx + chunkSize + 60) {
            endIdx = candidateEnd;
          }
        }
      }

      const rawContent = normalized.substring(startIdx, endIdx).trim();
      if (rawContent.length >= minChunkSize || endIdx >= normalized.length) {
        chunks.push({
          chunkIndex,
          content: rawContent,
          startChar: startIdx,
          endChar: endIdx,
          tokenCount: Math.ceil(rawContent.length / 4),
          metadata: {
            ...baseMetadata,
            chunkSizeChars: rawContent.length,
          },
        });
        chunkIndex++;
      }

      // If we reached the end of document, break
      if (endIdx >= normalized.length) {
        break;
      }

      // Advance startIdx with overlap
      const step = Math.max(minChunkSize, (endIdx - startIdx) - chunkOverlap);
      startIdx += step;
    }

    return chunks;
  }
}

export const chunkingService = new ChunkingService();
