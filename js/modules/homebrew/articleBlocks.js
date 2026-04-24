const HOME_BREW_BLOCK_CLOSE_TOKENS = Object.freeze({
  section: ":::/section",
  table: ":::/table",
});

const HOME_BREW_BLOCK_SNIPPETS = Object.freeze({
  ru: Object.freeze({
    sectionTitle: "Новый раздел",
    sectionBody: "Опиши этот подраздел здесь.",
    tableTitle: "Новая таблица",
    tableColumns: "Столбец 1 | Столбец 2 | Столбец 3",
    tableRow: "Значение | Значение | Значение",
  }),
  en: Object.freeze({
    sectionTitle: "New section",
    sectionBody: "Describe this section here.",
    tableTitle: "New table",
    tableColumns: "Column 1 | Column 2 | Column 3",
    tableRow: "Value | Value | Value",
  }),
});

function resolveSnippetLanguage(languageCode) {
  return String(languageCode || "").toLowerCase().startsWith("en") ? "en" : "ru";
}

function parseDelimitedRow(value) {
  return String(value || "")
    .split("|")
    .map((entry) => String(entry || "").trim())
    .filter(Boolean);
}

export function buildSectionSnippet(languageCode) {
  const copy = HOME_BREW_BLOCK_SNIPPETS[resolveSnippetLanguage(languageCode)];
  return `:::section ${copy.sectionTitle}\n${copy.sectionBody}\n${HOME_BREW_BLOCK_CLOSE_TOKENS.section}`;
}

export function buildTableSnippet(languageCode) {
  const copy = HOME_BREW_BLOCK_SNIPPETS[resolveSnippetLanguage(languageCode)];
  return `:::table ${copy.tableTitle}\n${copy.tableColumns}\n${copy.tableRow}\n${HOME_BREW_BLOCK_CLOSE_TOKENS.table}`;
}

export function parseArticleBlocksFromSource(sourceText, getUiText) {
  // The article body supports a tiny markup dialect for richer layouts while
  // still staying plain-text friendly in changes.json.
  const source = String(sourceText || "");
  const blockPattern = /^:::(section|table)\s*(.*?)\r?\n/gm;
  const blocks = [];
  let lastIndex = 0;

  const pushTextBlocks = (text) => {
    const normalized = String(text || "").trim();
    if (!normalized) return;
    normalized
      .split(/\n{2,}/)
      .map((entry) => entry.trim())
      .filter(Boolean)
      .forEach((entry) => {
        blocks.push({ type: "text", body: entry });
      });
  };

  let match;
  while ((match = blockPattern.exec(source))) {
    const [, type, rawTitle] = match;
    const typedClosePattern = new RegExp(`^\\s*${HOME_BREW_BLOCK_CLOSE_TOKENS[type].replace("/", "\\/")}\\s*$`, "gm");
    const legacyClosePattern = /^\s*:::\s*$/gm;
    typedClosePattern.lastIndex = blockPattern.lastIndex;
    legacyClosePattern.lastIndex = blockPattern.lastIndex;
    const closeMatch = typedClosePattern.exec(source) || legacyClosePattern.exec(source);
    if (!closeMatch) break;

    pushTextBlocks(source.slice(lastIndex, match.index));
    const rawBody = source.slice(blockPattern.lastIndex, closeMatch.index).replace(/\r?\n$/, "");
    const body = String(rawBody || "").trim();
    if (type === "section") {
      blocks.push({
        type: "section",
        title: String(rawTitle || "").trim() || getUiText("homebrew_section_fallback_title"),
        body,
      });
    } else if (type === "table") {
      const rows = body
        .split(/\r?\n/)
        .map((entry) => parseDelimitedRow(entry))
        .filter((entry) => entry.length);
      const [columns, ...tableRows] = rows;
      blocks.push({
        type: "table",
        title: String(rawTitle || "").trim() || getUiText("homebrew_table_fallback_title"),
        columns: columns || [],
        rows: tableRows,
      });
    }
    lastIndex = closeMatch.index + closeMatch[0].length;
    while (source[lastIndex] === "\r" || source[lastIndex] === "\n") lastIndex += 1;
    blockPattern.lastIndex = lastIndex;
  }

  pushTextBlocks(source.slice(lastIndex));
  return blocks;
}

export function renderArticleBlocks(container, blocks, options) {
  const { parseArticleBlocksFromSource, getUiText } = options;

  blocks.forEach((block) => {
    if (block.type === "text") {
      const content = document.createElement("div");
      content.className = "homebrew-article-content";
      content.textContent = block.body;
      container.appendChild(content);
      return;
    }

    if (block.type === "section") {
      const section = document.createElement("details");
      section.className = "homebrew-article-section";

      const summary = document.createElement("summary");
      summary.className = "homebrew-article-section-summary";
      summary.textContent = block.title || getUiText("homebrew_section_fallback_title");
      section.appendChild(summary);

      const sectionBody = document.createElement("div");
      sectionBody.className = "homebrew-article-section-body";
      renderArticleBlocks(sectionBody, parseArticleBlocksFromSource(block.body), options);
      section.appendChild(sectionBody);
      container.appendChild(section);
      return;
    }

    if (block.type === "table" && block.columns.length) {
      const tableWrap = document.createElement("details");
      tableWrap.className = "homebrew-article-table";

      const tableTitle = document.createElement("summary");
      tableTitle.className = "homebrew-article-table-title";
      tableTitle.textContent = block.title || getUiText("homebrew_table_fallback_title");
      tableWrap.appendChild(tableTitle);

      const tableInner = document.createElement("div");
      tableInner.className = "homebrew-article-table-body";

      const table = document.createElement("table");
      table.className = "homebrew-article-table-grid";

      const thead = document.createElement("thead");
      const headRow = document.createElement("tr");
      block.columns.forEach((column) => {
        const cell = document.createElement("th");
        cell.textContent = column;
        headRow.appendChild(cell);
      });
      thead.appendChild(headRow);
      table.appendChild(thead);

      const tbody = document.createElement("tbody");
      block.rows.forEach((row) => {
        const rowElement = document.createElement("tr");
        block.columns.forEach((_, index) => {
          const cell = document.createElement("td");
          cell.textContent = row[index] || "";
          rowElement.appendChild(cell);
        });
        tbody.appendChild(rowElement);
      });
      table.appendChild(tbody);
      tableInner.appendChild(table);
      tableWrap.appendChild(tableInner);
      container.appendChild(tableWrap);
    }
  });
}
