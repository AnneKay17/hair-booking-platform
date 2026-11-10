export const NAME_MAX = 100;
export const PHONE_MIN = 6;
export const PHONE_MAX = 30;
export const NOTES_MAX = 500;

// Deliberately loose: digits, spaces, +, -, ( ), and dots.
const PHONE_PATTERN = /^[0-9+()\-\s.]+$/;

/** @returns {{ name?: string, phone?: string, notes?: string }} an empty object means valid */
export const validateCustomerDetails = ({ name, phone, notes }) => {
  const errors = {};
  const trimmedName = name.trim();
  const trimmedPhone = phone.trim();

  if (!trimmedName) errors.name = "Please enter your name.";
  else if (trimmedName.length > NAME_MAX) errors.name = `Name must be ${NAME_MAX} characters or fewer.`;

  if (!trimmedPhone) {
    errors.phone = "Please enter your phone number.";
  } else if (
    trimmedPhone.length < PHONE_MIN ||
    trimmedPhone.length > PHONE_MAX ||
    !PHONE_PATTERN.test(trimmedPhone)
  ) {
    errors.phone = "Please enter a valid phone number.";
  }

  if (notes.length > NOTES_MAX) errors.notes = `Notes must be ${NOTES_MAX} characters or fewer.`;

  return errors;
};

/** "hb-4k9x2r", "4K9X2R" and "HB4K9X2R" all become "HB-4K9X2R". */
export const normalizeBookingReference = (input) => {
  const cleaned = input.trim().toUpperCase().replace(/\s+/g, "");
  const match = cleaned.match(/^(?:HB-?)?([A-Z0-9]{6})$/);
  return match ? `HB-${match[1]}` : cleaned;
};

export const isPlausibleBookingReference = (reference) => /^HB-[A-Z0-9]{6}$/.test(reference);