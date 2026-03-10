// ── Helpers ──────────────────────────────────────────────────────────────────
function uint8ToBase64(bytes) {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function base64ToUint8(str) {
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  return Uint8Array.from(raw, c => c.charCodeAt(0));
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Returns true if the device has a platform biometric authenticator */
export async function isBiometricAvailable() {
  if (!window.PublicKeyCredential) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

/**
 * Register a new biometric credential for this device.
 * Returns the credential ID as a base64url string to store in the profile.
 */
export async function registerBiometric(userId) {
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  // userId must be ≤ 64 bytes; Supabase UUIDs are 36 chars — fine as-is
  const userIdBytes = new TextEncoder().encode(userId.slice(0, 64));

  const credential = await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: "Cove", id: window.location.hostname },
      user: { id: userIdBytes, name: "cove-user", displayName: "Cove" },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 },   // ES256  (iOS, Android, Mac)
        { type: "public-key", alg: -257 },  // RS256  (Windows Hello fallback)
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",   // device-local only (no USB keys)
        userVerification: "required",          // must pass biometric/PIN
        residentKey: "preferred",
      },
      timeout: 60000,
    },
  });

  return uint8ToBase64(new Uint8Array(credential.rawId));
}

/**
 * Verify biometric for an existing credential.
 * Throws if the user cancels or the check fails.
 */
export async function verifyBiometric(credentialIdBase64) {
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const credId = base64ToUint8(credentialIdBase64);

  await navigator.credentials.get({
    publicKey: {
      challenge,
      rpId: window.location.hostname,
      allowCredentials: [{ id: credId, type: "public-key", transports: ["internal"] }],
      userVerification: "required",
      timeout: 60000,
    },
  });
  // Resolving without throw = OS confirmed biometric ✓
  return true;
}