const placeholderMarkers = [
  "DUMMY",
  "EXAMPLE",
  "FAKE",
  "PLACEHOLDER",
  "PROJECT_REF",
  "REDACTED",
  "SAMPLE",
  "SYNTHETIC",
  "TEST-TOKEN-NOT-REAL",
  "UNKNOWN",
  "OWNER@EXAMPLE.COM"
];

export function isPlaceholderValue(value) {
  if (!value?.trim()) return false;
  const normalized = value.toUpperCase();
  return placeholderMarkers.some((marker) => normalized.includes(marker));
}
