CREATE TABLE IF NOT EXISTS vocab_folders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "ownerId" uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name varchar(120) NOT NULL CHECK (length(trim(name)) > 0),
  "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS vocab_sets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "folderId" uuid NOT NULL REFERENCES vocab_folders(id) ON DELETE CASCADE,
  name varchar(120) NOT NULL CHECK (length(trim(name)) > 0),
  "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS vocab_cards (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "setId" uuid NOT NULL REFERENCES vocab_sets(id) ON DELETE CASCADE,
  meaning varchar(500) NOT NULL CHECK (length(trim(meaning)) > 0),
  reading varchar(200) NOT NULL CHECK (length(reading) > 0),
  japanese varchar(200) NOT NULL DEFAULT '',
  "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS vocab_folders_owner ON vocab_folders("ownerId");
CREATE INDEX IF NOT EXISTS vocab_sets_folder ON vocab_sets("folderId");
CREATE INDEX IF NOT EXISTS vocab_cards_set ON vocab_cards("setId");
