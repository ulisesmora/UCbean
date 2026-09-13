-- QA admin account for the counter app. Role OWNER is the highest there is.
-- A migration, so Railway applies it on boot without anyone reaching the
-- database from outside. Only the bcrypt hash is stored, never the password.
-- If the email already exists, its password and role are reset instead.
INSERT INTO "User" ("id", "email", "name", "passwordHash", "role", "emailVerifiedAt", "createdAt", "updatedAt")
VALUES (gen_random_uuid()::text, 'admin@aroundthebean.ca', 'Admin QA', '$2b$12$Mprllprnr.yn5Mt3PNV4j.MwCzTOCpDZE34812ifHzcuiBAyxbdii', 'OWNER', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("email") DO UPDATE SET
  "passwordHash" = EXCLUDED."passwordHash",
  "role" = 'OWNER',
  "emailVerifiedAt" = COALESCE("User"."emailVerifiedAt", CURRENT_TIMESTAMP),
  "updatedAt" = CURRENT_TIMESTAMP;
