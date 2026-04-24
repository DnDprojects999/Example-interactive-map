const PLACEHOLDER_PATTERNS = [
  "новый поворот хроники",
  "new turn of the chronicle",
  "новая глава",
  "new chapter",
  "новая запись",
  "new record",
  "новая фракция",
  "new faction",
  "новый город",
  "new city",
  "новый орган власти",
  "new authority",
  "новая партия",
  "new party",
  "новый герой",
  "new hero",
  "добавь портрет героя",
  "add a hero portrait",
  "описание пока",
  "no description yet",
  "короткое описание",
  "short description",
  "подробное описание",
  "detailed record description",
  "роль в хронике",
  "role in the chronicle",
  "факт 1",
  "факт 2",
  "факт 3",
  "fact 1",
  "fact 2",
  "fact 3",
  "что именно произошло",
  "what happened",
];

export const AUDIT_LIMITS = Object.freeze({
  title: 90,
  label: 24,
  imageLabel: 56,
  dataUrlWarnLength: 300000,
});

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

export function isBlankOrPlaceholder(value) {
  const text = normalize(value);
  if (!text) return true;
  return PLACEHOLDER_PATTERNS.some((pattern) => text.includes(pattern));
}

export function isTooLong(value, limit) {
  return String(value || "").trim().length > limit;
}

export function addIssue(issues, code, scope, message, target = null, params = {}) {
  issues.push({ code, scope, message, target, params });
}

export function addIssueIf(condition, issues, code, scope, message, target = null, params = {}) {
  if (!condition) return;
  addIssue(issues, code, scope, message, target, params);
}

export function reportBlankField(issues, scope, code, value, fallback, target, params = {}) {
  addIssueIf(isBlankOrPlaceholder(value), issues, code, scope, fallback, target, params);
}

export function reportLengthField(issues, scope, code, value, fallback, target, limit, params = {}) {
  addIssueIf(isTooLong(value, limit), issues, code, scope, fallback, target, params);
}

export function checkPossibleUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;

  if (raw === "http:" || raw === "https:" || raw === "http://" || raw === "https://") {
    return "Ссылка выглядит незаконченной.";
  }

  if (/\s/.test(raw)) {
    return "В ссылке есть пробелы.";
  }

  if (raw.startsWith("data:")) {
    return /^data:image\/[a-z0-9.+-]+;base64,/i.test(raw) ? null : "Data URL выглядит подозрительно.";
  }

  if (/^(https?:)?\/\//i.test(raw)) {
    try {
      const url = new URL(raw.startsWith("//") ? `https:${raw}` : raw);
      return ["http:", "https:"].includes(url.protocol) ? null : "Неподдерживаемый протокол ссылки.";
    } catch {
      return "Ссылка не похожа на валидный URL.";
    }
  }

  if (/^(assets\/|\.\/|\.\.\/|\/)/.test(raw)) return null;
  if (/^[\w./-]+\.(png|jpg|jpeg|webp|gif|svg|avif)$/i.test(raw)) return null;
  return "Ссылка не похожа на URL или путь к файлу.";
}

export function registerEntityId(registry, namespace, scopeLabel, id, target) {
  const key = String(id || "").trim();
  if (!key) return;

  const registryKey = `${namespace}:${key}`;
  if (!registry.has(registryKey)) registry.set(registryKey, []);
  registry.get(registryKey).push({
    scopeLabel,
    idLabel: key,
    target,
  });
}

export function reportDuplicateIds(issues, registry) {
  registry.forEach((entries) => {
    if (entries.length < 2) return;
    const [first] = entries;
    addIssue(
      issues,
      "duplicate-id",
      "id",
      `Идентификатор "${first.idLabel}" повторяется в ${entries.length} местах внутри ${first.scopeLabel}. Лучше сделать его уникальным.`,
      first.target,
      { idLabel: first.idLabel, count: entries.length, scopeLabel: first.scopeLabel },
    );
  });
}

export function reportImageUrlIssues(issues, scope, ownerTitle, imageUrl, target) {
  const linkProblem = checkPossibleUrl(imageUrl);
  if (linkProblem) {
    addIssue(issues, "suspicious-image-url", scope, `${ownerTitle}: ${linkProblem}`, target, { ownerTitle });
  }

  if (String(imageUrl || "").startsWith("data:") && String(imageUrl).length > AUDIT_LIMITS.dataUrlWarnLength) {
    addIssue(
      issues,
      "heavy-data-url",
      scope,
      `${ownerTitle}: это изображение лучше вынести в assets, чтобы сайт не пух.`,
      target,
      { ownerTitle },
    );
  }
}

export function fixMojibake(value) {
  const source = String(value || "");
  if (!/[Р РЎРѓГ‘ГђпїЅ]/.test(source) && !/[пїЅ]/.test(source)) return source;
  try {
    let current = source;
    for (let index = 0; index < 2; index += 1) {
      const bytes = Uint8Array.from(Array.from(current, (char) => char.charCodeAt(0) & 0xff));
      const decoded = new TextDecoder("utf-8").decode(bytes);
      if (!decoded || decoded === current) break;
      current = decoded;
    }
    return current || source;
  } catch {
    return source;
  }
}
