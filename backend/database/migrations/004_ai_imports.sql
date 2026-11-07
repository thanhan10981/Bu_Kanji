CREATE TABLE IF NOT EXISTS ai_import_jobs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "ownerId" uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name varchar(240) NOT NULL,
  size integer NOT NULL CHECK (size BETWEEN 1 AND 104857600),
  model varchar(40) NOT NULL,
  "lastModified" bigint NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'uploading',
  error text,
  "pagesRead" integer NOT NULL DEFAULT 0,
  "totalPages" integer NOT NULL DEFAULT 0,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  "expiresAt" timestamptz NOT NULL DEFAULT now() + interval '24 hours'
);
CREATE INDEX IF NOT EXISTS ai_import_jobs_owner_idx ON ai_import_jobs("ownerId");
CREATE INDEX IF NOT EXISTS ai_import_jobs_expiry_idx ON ai_import_jobs("expiresAt");
CREATE TABLE IF NOT EXISTS ai_import_parts (
  "jobId" uuid NOT NULL REFERENCES ai_import_jobs(id) ON DELETE CASCADE,
  index integer NOT NULL,
  data bytea NOT NULL,
  PRIMARY KEY("jobId", index)
);
CREATE TABLE IF NOT EXISTS ai_import_batches (
  "jobId" uuid NOT NULL REFERENCES ai_import_jobs(id) ON DELETE CASCADE,
  index integer NOT NULL,
  text text NOT NULL,
  cards jsonb,
  PRIMARY KEY("jobId", index)
);
