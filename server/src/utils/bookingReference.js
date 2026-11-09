//Generates a short, unambiguous, customer-safe reference. Uniqueness is enforced at the database level, not assumed here.
import crypto from "crypto";

// Excludes 0/O and 1/I to avoid customer confusion when read aloud or typed.
const CHARSET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const CODE_LENGTH = 6;

export const generateBookingReference = () => {
  const bytes = crypto.randomBytes(CODE_LENGTH);
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CHARSET[bytes[i] % CHARSET.length];
  }
  return `HB-${code}`;
};