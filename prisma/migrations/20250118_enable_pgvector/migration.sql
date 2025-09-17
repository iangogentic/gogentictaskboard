-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create index on embedding vectors if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE indexname = 'embedding_vector_idx'
    ) THEN
        CREATE INDEX embedding_vector_idx ON "Embedding" USING ivfflat (vector vector_cosine_ops);
    END IF;
END $$;