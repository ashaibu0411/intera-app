-- Public half of X25519 keypair for DM encryption (private key stays on device only)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS e2e_public_key text;

COMMENT ON COLUMN public.profiles.e2e_public_key IS 'Base64 Curve25519 public key for E2E DMs; ciphertext in messages.content uses E2E1: prefix.';
