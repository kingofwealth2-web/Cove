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

/** Infer a human-readable device label from userAgent */
export function getDeviceLabel() {
  const ua = navigator.userAgent;
  if (/iPhone/.test(ua)) return "iPhone";
  if (/iPad/.test(ua)) return "iPad";
  if (/Android/.test(ua)) return "Android";
  if (/Mac OS X/.test(ua) && !/Chrome/.test(ua)) return "Mac (Safari)";
  if (/Macintosh/.test(ua)) return "Mac";
  if (/Windows/.test(ua)) return "Windows PC";
  if (/Linux/.test(ua)) return "Linux";
  return "Unknown device";
}

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
 * Returns an object { id, label, addedAt } to push into the credentials array.
 */
export async function registerBiometric(userId) {
  const challenge = crypto.getRandomValues(new Uint8Array(32));
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
        authenticatorAttachment: "platform",
        userVerification: "required",
        residentKey: "preferred",
      },
      timeout: 60000,
    },
  });

  return {
    id: uint8ToBase64(new Uint8Array(credential.rawId)),
    label: getDeviceLabel(),
    addedAt: new Date().toISOString(),
  };
}

/**
 * Verify biometric against an array of registered credentials.
 * Tries all credentials for this device — the OS picks the matching one.
 * Throws if cancelled or failed.
 */
export async function verifyBiometric(credentials) {
  // Accept either the old single-string format or new array format
  const credList = Array.isArray(credentials)
    ? credentials
    : [{ id: credentials }];

  if (credList.length === 0) throw new Error("No credentials registered");

  const challenge = crypto.getRandomValues(new Uint8Array(32));

  await navigator.credentials.get({
    publicKey: {
      challenge,
      rpId: window.location.hostname,
      allowCredentials: credList.map(c => ({
        id: base64ToUint8(c.id),
        type: "public-key",
        transports: ["internal"],
      })),
      userVerification: "required",
      timeout: 60000,
    },
  });

  return true;
}