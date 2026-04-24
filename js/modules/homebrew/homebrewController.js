import {
  setLocalizedValue,
} from "../localization.js";
import {
  createHomebrewArticleTemplate,
  createHomebrewCategoryTemplate,
} from "../entityTemplates.js";
import { getUiText } from "../uiLocale.js";
import {
  parseArticleBlocksFromSource,
  renderArticleBlocks,
} from "./articleBlocks.js";
import { renderHomebrewArticleEditor } from "./homebrewEditorView.js";
import {
  createHomebrewViewController,
} from "./homebrewViewController.js";
import {
  buildHomebrewCategoryMeta,
  getAvailableHomebrewLanguages,
  getHomebrewTypeLabel,
  getLocalizedHomebrewArticleText,
  getLocalizedHomebrewCategoryTitle,
  getSortedHomebrewCategories,
  getVisibleHomebrewArticles,
} from "./homebrewState.js";
import {
  normalizeHomebrewType,
  normalizeHomebrewUrl,
  readFileToDataUrl,
} from "./homebrewShared.js";

export function createHomebrewController(options) {
  const {
    els,
    state,
    generateEntityId,
    getChangeRecorder,
    openMapMode,
    onLanguageChange,
  } = options;

  const getRecorder = () => getChangeRecorder?.() || { upsert: () => {}, remove: () => {} };

  const t = (key, params) => getUiText(state, key, params);
  const getTypeLabel = (type) => getHomebrewTypeLabel(state, type);
  const getLocalizedCategoryTitle = (category) => getLocalizedHomebrewCategoryTitle(category, state);
  const getLocalizedArticleText = (article, field, fallback = "") => getLocalizedHomebrewArticleText(article, field, state, fallback);
  const getSortedCategories = () => getSortedHomebrewCategories(state);
  const getVisibleArticles = () => getVisibleHomebrewArticles(state);
  const buildCategoryMeta = (article) => buildHomebrewCategoryMeta(article, state);

  function persistCategory(category) {
    getRecorder().upsert("homebrewCategory", category.id, category);
  }

  function persistArticle(article) {
    getRecorder().upsert("homebrewArticle", article.id, article);
  }

  function isArticleEditing(articleId) {
    return Boolean(state.editMode && state.currentHomebrewEditingArticleId === articleId);
  }

  function isCategoryEditing(categoryId) {
    return Boolean(state.editMode && state.currentHomebrewEditingCategoryId === categoryId);
  }

  function isCategoryPickerOpen(articleId) {
    return Boolean(state.editMode && state.currentHomebrewCategoryPickerArticleId === articleId);
  }

  function toggleLanguagePopover(forceState) {
    const nextState = typeof forceState === "boolean"
      ? forceState
      : Boolean(els.homebrewLanguagePopover.hidden);
    els.homebrewLanguagePopover.hidden = !nextState;
    els.homebrewLanguageButton.setAttribute("aria-expanded", nextState ? "true" : "false");
  }

  function renderLanguageOptions() {
    els.homebrewLanguageOptions.innerHTML = "";

    getAvailableHomebrewLanguages(state).forEach((language) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "homebrew-language-option";
      button.textContent = `${language.label} ${String(language.code || "").toUpperCase()}`;
      button.classList.toggle("active", language.code === state.currentLanguage);
      button.addEventListener("click", () => {
        state.currentLanguage = language.code;
        toggleLanguagePopover(false);
        onLanguageChange?.(language.code);
      });
      els.homebrewLanguageOptions.appendChild(button);
    });
  }

  function createCategory() {
    if (!state.editMode) return;

    const category = {
      ...createHomebrewCategoryTemplate(state.homebrewCategoriesData.length),
      id: generateEntityId("homebrew-category"),
    };
    state.homebrewCategoriesData.push(category);
    state.currentHomebrewCategoryId = category.id;
    state.currentHomebrewEditingCategoryId = category.id;
    persistCategory(category);
    render();
  }

  function editCategory(categoryId) {
    if (!state.editMode) return;
    state.currentHomebrewEditingCategoryId = categoryId;
    render();
  }

  function updateCategoryTitle(category, value) {
    const fallbackTitle = t("prompt_homebrew_category_title");
    setLocalizedValue(category, "title", String(value || "").trim() || fallbackTitle, state);
    persistCategory(category);
  }

  function closeCategoryEditor() {
    state.currentHomebrewEditingCategoryId = null;
    render();
  }

  function toggleArticleCategoryPicker(articleId) {
    state.currentHomebrewCategoryPickerArticleId = state.currentHomebrewCategoryPickerArticleId === articleId
      ? null
      : articleId;
    render();
  }

  function deleteCategory(categoryId) {
    if (!state.editMode) return;
    const category = (state.homebrewCategoriesData || []).find((entry) => entry.id === categoryId);
    if (!category) return;

    const label = getLocalizedCategoryTitle(category);
    if (!window.confirm(t("confirm_homebrew_delete_category", { label }))) return;

    state.homebrewCategoriesData = (state.homebrewCategoriesData || []).filter((entry) => entry.id !== categoryId);
    getRecorder().remove("homebrewCategory", categoryId);

    (state.homebrewArticlesData || []).forEach((article) => {
      if (!Array.isArray(article.categoryIds) || !article.categoryIds.includes(categoryId)) return;
      article.categoryIds = article.categoryIds.filter((entry) => entry !== categoryId);
      persistArticle(article);
    });

    if (state.currentHomebrewCategoryId === categoryId) {
      state.currentHomebrewCategoryId = "all";
    }
    if (state.currentHomebrewEditingCategoryId === categoryId) {
      state.currentHomebrewEditingCategoryId = null;
    }
    render();
  }

  function createArticle() {
    if (!state.editMode) return;

    const article = {
      ...createHomebrewArticleTemplate(state.homebrewArticlesData.length, state.currentHomebrewType),
      id: generateEntityId("homebrew-article"),
      type: normalizeHomebrewType(state.currentHomebrewType),
      categoryIds: state.currentHomebrewCategoryId !== "all" ? [state.currentHomebrewCategoryId] : [],
    };

    state.homebrewArticlesData.push(article);
    state.currentHomebrewType = article.type;
    state.currentHomebrewArticleId = article.id;
    state.currentHomebrewEditingArticleId = article.id;
    persistArticle(article);
    render();
  }

  function openArticleEditor(articleId) {
    if (!state.editMode) return;
    state.currentHomebrewArticleId = articleId;
    state.currentHomebrewEditingArticleId = articleId;
    render();
  }

  function closeArticleEditor() {
    state.currentHomebrewEditingArticleId = null;
    render();
  }

  function deleteArticle(articleId) {
    if (!state.editMode) return;
    const article = (state.homebrewArticlesData || []).find((entry) => entry.id === articleId);
    if (!article) return;

    const label = getLocalizedArticleText(article, "title", "Article");
    if (!window.confirm(t("confirm_homebrew_delete_article", { label }))) return;

    state.homebrewArticlesData = (state.homebrewArticlesData || []).filter((entry) => entry.id !== articleId);
    getRecorder().remove("homebrewArticle", articleId);
    if (state.currentHomebrewArticleId === articleId) state.currentHomebrewArticleId = null;
    if (state.currentHomebrewEditingArticleId === articleId) state.currentHomebrewEditingArticleId = null;
    render();
  }

  function updateArticleLocalizedField(article, field, value) {
    setLocalizedValue(article, field, String(value || ""), state);
    persistArticle(article);
  }

  function appendArticleContentSnippet(article, snippet) {
    const currentValue = getLocalizedArticleText(article, "content", "");
    const nextValue = currentValue.trim()
      ? `${currentValue.replace(/\s*$/, "")}\n\n${snippet}`
      : snippet;
    updateArticleLocalizedField(article, "content", nextValue);
    render();
  }

  function updateArticleSource(article, value) {
    article.sourceUrl = String(value || "").trim();
    persistArticle(article);
  }

  function updateArticleImage(article, value) {
    article.imageUrl = String(value || "").trim();
    persistArticle(article);
  }

  async function importArticleImageFile(article, file) {
    if (!file || !String(file.type || "").startsWith("image/")) return false;

    try {
      const dataUrl = await readFileToDataUrl(file);
      updateArticleImage(article, dataUrl);
      return true;
    } catch (error) {
      window.alert(t("homebrew_image_read_error"));
      return false;
    }
  }

  function updateArticleType(article, nextType) {
    article.type = normalizeHomebrewType(nextType);
    state.currentHomebrewType = article.type;
    persistArticle(article);
    render();
  }

  function toggleArticleCategory(article, categoryId) {
    const currentIds = Array.isArray(article.categoryIds) ? article.categoryIds : [];
    article.categoryIds = currentIds.includes(categoryId)
      ? currentIds.filter((entry) => entry !== categoryId)
      : [...currentIds, categoryId];
    persistArticle(article);
    render();
  }

  function parseArticleBlocks(article) {
    return parseArticleBlocksFromSource(
      getLocalizedArticleText(article, "content", ""),
      (key) => t(key),
    );
  }

  function renderExpandedArticleBody(article, body) {
    const layout = document.createElement("div");
    layout.className = "homebrew-article-layout";
    const normalizedImageUrl = normalizeHomebrewUrl(article.imageUrl);
    if (normalizedImageUrl) layout.classList.add("has-media");

    const textColumn = document.createElement("div");
    textColumn.className = "homebrew-article-text";
    renderArticleBlocks(textColumn, parseArticleBlocks(article), {
      getUiText: (key) => t(key),
      parseArticleBlocksFromSource: (sourceText) => parseArticleBlocksFromSource(sourceText, (key) => t(key)),
    });

    if (normalizedImageUrl) {
      const media = document.createElement("aside");
      media.className = "homebrew-article-media";
      const mediaImage = document.createElement("img");
      mediaImage.className = "homebrew-article-media-image";
      mediaImage.src = normalizedImageUrl;
      mediaImage.alt = getLocalizedArticleText(article, "title", "Homebrew");
      media.appendChild(mediaImage);
      layout.appendChild(media);
    }

    layout.appendChild(textColumn);
    body.appendChild(layout);

    const normalizedUrl = normalizeHomebrewUrl(article.sourceUrl);
    if (!normalizedUrl) return;

    const source = document.createElement("div");
    source.className = "homebrew-article-source";

    const sourceLabel = document.createElement("span");
    sourceLabel.className = "homebrew-article-source-label";
    sourceLabel.textContent = t("homebrew_source_label");
    source.appendChild(sourceLabel);

    const sourceLink = document.createElement("a");
    sourceLink.className = "homebrew-article-source-link";
    sourceLink.href = normalizedUrl;
    sourceLink.target = "_blank";
    sourceLink.rel = "noreferrer noopener";
    sourceLink.textContent = t("homebrew_source_open");
    source.appendChild(sourceLink);
    body.appendChild(source);
  }

  const viewController = createHomebrewViewController({
    els,
    state,
    getUiText: t,
    getTypeLabel,
    getLocalizedCategoryTitle,
    getLocalizedArticleText,
    getVisibleArticles,
    getSortedCategories,
    buildCategoryMeta,
    isArticleEditing,
    isCategoryEditing,
    renderArticleEditor: (article, body) => renderHomebrewArticleEditor({
      article,
      body,
      state,
      getUiText: t,
      getTypeLabel,
      getLocalizedCategoryTitle,
      getLocalizedArticleText,
      getSortedCategories,
      isCategoryPickerOpen,
      updateArticleType,
      updateArticleLocalizedField,
      appendArticleContentSnippet,
      importArticleImageFile,
      updateArticleImage,
      updateArticleSource,
      toggleArticleCategory,
      toggleArticleCategoryPicker,
      render,
    }),
    renderExpandedArticleBody,
    createCategory,
    editCategory,
    updateCategoryTitle,
    closeCategoryEditor,
    deleteCategory,
    openArticleEditor,
    closeArticleEditor,
    deleteArticle,
    render,
  });

  function render() {
    toggleLanguagePopover(false);
    if (!state.editMode) {
      state.currentHomebrewEditingArticleId = null;
      state.currentHomebrewEditingCategoryId = null;
      state.currentHomebrewCategoryPickerArticleId = null;
    }

    if (els.homebrewSearchInput) {
      els.homebrewSearchInput.placeholder = t("homebrew_search_placeholder");
      if (els.homebrewSearchInput.value !== String(state.homebrewSearchQuery || "")) {
        els.homebrewSearchInput.value = String(state.homebrewSearchQuery || "");
      }
    }

    els.homebrewMapButton.textContent = t("mode_map");
    els.homebrewLanguageLabel.textContent = String(state.currentLanguage || "ru").toUpperCase();
    els.addHomebrewCategoryButton.textContent = t("homebrew_add_category");
    els.addHomebrewArticleButton.textContent = t("homebrew_add_article");
    els.homebrewEditorTools.hidden = !state.editMode;

    const typeButtons = els.homebrewTypeSwitch?.querySelectorAll("[data-homebrew-type]") || [];
    typeButtons.forEach((button) => {
      const type = normalizeHomebrewType(button.dataset.homebrewType);
      button.textContent = getTypeLabel(type);
      button.classList.toggle("active", type === normalizeHomebrewType(state.currentHomebrewType));
    });

    renderLanguageOptions();
    viewController.renderCategories();
    viewController.renderArticles();
  }

  function focusArticle(articleId) {
    const article = (state.homebrewArticlesData || []).find((entry) => entry.id === articleId);
    if (article) {
      state.currentHomebrewType = normalizeHomebrewType(article.type);
    }
    state.currentHomebrewArticleId = articleId;
    render();
    requestAnimationFrame(() => {
      els.homebrewArticles.querySelector(".homebrew-article-card.expanded")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  function setup() {
    els.homebrewMapButton.addEventListener("click", () => openMapMode?.());
    els.homebrewLanguageButton.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleLanguagePopover();
    });
    els.homebrewSearchInput.addEventListener("input", (event) => {
      state.homebrewSearchQuery = String(event.target.value || "");
      render();
    });
    els.homebrewTypeSwitch.addEventListener("click", (event) => {
      const button = event.target.closest("[data-homebrew-type]");
      if (!button) return;
      state.currentHomebrewType = normalizeHomebrewType(button.dataset.homebrewType);
      state.currentHomebrewArticleId = null;
      state.currentHomebrewEditingArticleId = null;
      render();
    });
    els.addHomebrewCategoryButton.addEventListener("click", createCategory);
    els.addHomebrewArticleButton.addEventListener("click", createArticle);

    document.addEventListener("click", (event) => {
      if (
        els.homebrewLanguagePopover.hidden
        || els.homebrewLanguagePopover.contains(event.target)
        || els.homebrewLanguageButton.contains(event.target)
      ) {
        return;
      }
      toggleLanguagePopover(false);
    });
  }

  return {
    setup,
    render,
    focusArticle,
  };
}
