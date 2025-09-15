-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Drop the old vector column if it exists
ALTER TABLE "Embedding" DROP COLUMN IF EXISTS vector;

-- Add the vector column with proper type (1536 dimensions for OpenAI embeddings)
ALTER TABLE "Embedding" ADD COLUMN vector vector(1536);

-- Create an index for similarity search
CREATE INDEX IF NOT EXISTS embedding_vector_idx ON "Embedding" 
USING ivfflat (vector vector_cosine_ops)
WITH (lists = 100);