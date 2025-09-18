-- Enable pgvector extension (skip if not available)
DO $$
BEGIN
    -- Check if extension is available before creating
    IF EXISTS (
        SELECT 1 FROM pg_available_extensions WHERE name = 'vector'
    ) THEN
        CREATE EXTENSION IF NOT EXISTS vector;

        -- Drop the old vector column if it exists
        IF EXISTS (
            SELECT column_name FROM information_schema.columns
            WHERE table_name = 'Embedding' AND column_name = 'vector'
        ) THEN
            ALTER TABLE "Embedding" DROP COLUMN vector;
        END IF;

        -- Add the vector column with proper type (1536 dimensions for OpenAI embeddings)
        -- Only if vector type exists
        IF EXISTS (
            SELECT 1 FROM pg_type WHERE typname = 'vector'
        ) THEN
            ALTER TABLE "Embedding" ADD COLUMN vector vector(1536);

            -- Create an index for similarity search
            CREATE INDEX IF NOT EXISTS embedding_vector_idx ON "Embedding"
            USING ivfflat (vector vector_cosine_ops)
            WITH (lists = 100);
        END IF;
    END IF;
END $$;