// Derives a stable field key from a user-typed label, e.g. "Referred By"
// -> "referred_by". Ensures uniqueness against any keys already in use on
// the template by appending _2, _3, etc.
export function slugifyFieldKey(label, existingKeys = []) {
  const base =
    label
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'field'

  if (!existingKeys.includes(base)) return base

  let suffix = 2
  while (existingKeys.includes(`${base}_${suffix}`)) {
    suffix += 1
  }
  return `${base}_${suffix}`
}
