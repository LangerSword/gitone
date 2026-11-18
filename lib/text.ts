// Display-text helpers.

// " — " → ": " for the first break (reads as a definition), then ", " for any
// remaining breaks. Also handles the "--" ASCII variant.
export function deEmDash(input: string): string {
  let seen = false;
  return input
    .replace(/\s*(—|--)\s*/g, () => {
      if (!seen) {
        seen = true;
        return ": ";
      }
      return ", ";
    })
    .trim();
}

// Driver name for the card: short enough stays whole; long names drop to the
// surname; multi-word surnames that won't fit fall back to the first name.
const MAX_SURNAME_CHARS = 13;
const MAX_SURNAME_WORDS = 3;

export function cardDisplayName(name: string): string {
  const full = name.trim();
  if (full.length <= 9) return full;
  const [first, ...rest] = full.split(/\s+/);
  if (rest.length === 0) return full;
  const surname = rest.join(" ");
  const tooBig =
    surname.length > MAX_SURNAME_CHARS || rest.length > MAX_SURNAME_WORDS;
  return tooBig ? first : surname;
}
