-- Enable pgvector extension (skip if not available)
DO $$
BEGIN
    -- Check if extension is available before creating
    IF EXISTS (
        SELECT 1 FROM pg_available_extensions WHERE name = 'vector'
    ) THEN
        CREATE EXTENSION IF NOT EXISTS vector;

        -- Create index on embedding vectors if extension was created
        IF NOT EXISTS (
            SELECT 1
            FROM pg_indexes
            WHERE indexname = 'embedding_vector_idx'
        ) THEN
            -- Only create index if vector type exists
            IF EXISTS (
                SELECT 1 FROM pg_type WHERE typname = 'vector'
            ) THEN
                CREATE INDEX embedding_vector_idx ON "Embedding" USING ivfflat (vector vector_cosine_ops);
            END IF;
        END IF;
    END IF;
END $$;