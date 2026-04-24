export const HOME_BREW_TYPES = ["change", "new", "rule"];

export function normalizeHomebrewType(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return HOME_BREW_TYPES.includes(normalized) ? normalized : "change";
}

export function normalizeHomebrewUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^(data:image\/|blob:|file:|https?:\/\/|mailto:)/i.test(raw)) return raw;
  if (/^(\/|\.\/|\.\.\/)/.test(raw)) return raw;
  const firstSegment = raw.split("/")[0] || "";
  if (raw.includes("/") && !firstSegment.includes(".") && !firstSegment.includes(":")) return raw;
  return `https://${raw}`;
}

export function stopHomebrewEvent(event) {
  event.preventDefault();
  event.stopPropagation();
}

export function readFileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}
