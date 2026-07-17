const WEAK_SECRETS = new Set([
  "change-this-secret-in-production",
  "secret",
  "jwt-secret",
  "your-secret-key",
]);

export function validateSecurityConfig() {
  const errors = [];

  if (!process.env.DATABASE_URL) {
    errors.push("DATABASE_URL is required.");
  }

  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) {
    errors.push("JWT_SECRET is required.");
  } else if (secret.length < 32) {
    if (process.env.NODE_ENV === "production") {
      errors.push("JWT_SECRET must be at least 32 characters.");
    } else {
      console.warn("[security] JWT_SECRET should be at least 32 characters for production.");
    }
  } else if (
    process.env.NODE_ENV === "production"
    && WEAK_SECRETS.has(secret.toLowerCase())
  ) {
    errors.push("JWT_SECRET is too weak. Use a long random string.");
  }

  if (process.env.NODE_ENV === "production" && !process.env.FRONTEND_URL) {
    errors.push("FRONTEND_URL is required in production for CORS.");
  }

  if (errors.length > 0) {
    throw new Error(`Security configuration error:\n- ${errors.join("\n- ")}`);
  }
}

export const BCRYPT_ROUNDS = 12;
export const JSON_BODY_LIMIT = "64kb";
