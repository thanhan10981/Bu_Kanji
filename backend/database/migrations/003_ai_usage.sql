CREATE TABLE IF NOT EXISTS ai_usage (
  scope varchar(160) NOT NULL,
  bucket timestamptz NOT NULL,
  requests integer NOT NULL DEFAULT 0 CHECK (requests >= 0),
  PRIMARY KEY (scope, bucket)
);
CREATE INDEX IF NOT EXISTS ai_usage_bucket_idx ON ai_usage(bucket);
