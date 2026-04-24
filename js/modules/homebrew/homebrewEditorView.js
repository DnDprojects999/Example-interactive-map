import { buildSectionSnippet, buildTableSnippet } from "./articleBlocks.js";
import { normalizeHomebrewUrl } from "./homebrewShared.js";

function appendEditorField(body, labelText, control) {
  const field = document.createElement("label");
  field.className = "homebrew-editor-field";

  const label = document.createElement("span");
  label.className = "homebrew-editor-label";
  label.textContent = labelText;
  field.appendChild(label);

  field.appendChild(control);
  body.appendChild(field);
}

export function renderHomebrewArticleEditor(options) {
  const {
    article,
    body,
    state,
    getUiText,
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
  } = options;

  const typeSelect = document.createElement("select");
  typeSelect.className = "homebrew-editor-select";
  ["change", "new", "rule"].forEach((type) => {
    const option = document.createElement("option");
    option.value = type;
    option.textContent = getTypeLabel(type);
    option.selected = article.type === type;
    typeSelect.appendChild(option);
  });
  typeSelect.addEventListener("change", (event) => {
    updateArticleType(article, event.target.value);
  });
  appendEditorField(body, getUiText("homebrew_field_type"), typeSelect);

  const titleInput = document.createElement("input");
  titleInput.type = "text";
  titleInput.className = "homebrew-editor-input";
  titleInput.value = getLocalizedArticleText(article, "title", "");
  titleInput.placeholder = getUiText("homebrew_field_title");
  titleInput.addEventListener("input", (event) => {
    updateArticleLocalizedField(article, "title", event.target.value);
  });
  appendEditorField(body, getUiText("homebrew_field_title"), titleInput);

  const summaryInput = document.createElement("textarea");
  summaryInput.className = "homebrew-editor-textarea homebrew-editor-textarea-summary";
  summaryInput.value = getLocalizedArticleText(article, "summary", "");
  summaryInput.placeholder = getUiText("homebrew_field_summary");
  summaryInput.addEventListener("input", (event) => {
    updateArticleLocalizedField(article, "summary", event.target.value);
  });
  appendEditorField(body, getUiText("homebrew_field_summary"), summaryInput);

  const contentInput = document.createElement("textarea");
  contentInput.className = "homebrew-editor-textarea homebrew-editor-textarea-content";
  contentInput.value = getLocalizedArticleText(article, "content", "");
  contentInput.placeholder = getUiText("homebrew_field_content");
  contentInput.addEventListener("input", (event) => {
    updateArticleLocalizedField(article, "content", event.target.value);
  });
  appendEditorField(body, getUiText("homebrew_field_content"), contentInput);

  const contentHelpers = document.createElement("div");
  contentHelpers.className = "homebrew-content-helper-actions";

  const addSectionButton = document.createElement("button");
  addSectionButton.type = "button";
  addSectionButton.className = "ghost-btn homebrew-action-btn";
  addSectionButton.textContent = getUiText("homebrew_add_section");
  addSectionButton.addEventListener("click", () => {
    appendArticleContentSnippet(article, buildSectionSnippet(state.currentLanguage));
  });
  contentHelpers.appendChild(addSectionButton);

  const addTableButton = document.createElement("button");
  addTableButton.type = "button";
  addTableButton.className = "ghost-btn homebrew-action-btn";
  addTableButton.textContent = getUiText("homebrew_add_table");
  addTableButton.addEventListener("click", () => {
    appendArticleContentSnippet(article, buildTableSnippet(state.currentLanguage));
  });
  contentHelpers.appendChild(addTableButton);
  body.appendChild(contentHelpers);

  const imageField = document.createElement("div");
  imageField.className = "homebrew-editor-field";

  const imageLabel = document.createElement("span");
  imageLabel.className = "homebrew-editor-label";
  imageLabel.textContent = getUiText("homebrew_field_image");
  imageField.appendChild(imageLabel);

  const imageInput = document.createElement("input");
  imageInput.type = "url";
  imageInput.className = "homebrew-editor-input";
  imageInput.value = article.imageUrl || "";
  imageInput.placeholder = getUiText("homebrew_field_image");
  imageInput.addEventListener("input", (event) => {
    updateArticleImage(article, event.target.value);
  });
  imageField.appendChild(imageInput);

  const imageActions = document.createElement("div");
  imageActions.className = "homebrew-content-helper-actions";

  const uploadImageButton = document.createElement("button");
  uploadImageButton.type = "button";
  uploadImageButton.className = "ghost-btn homebrew-action-btn";
  uploadImageButton.textContent = getUiText("homebrew_add_image");
  const imageFileInput = document.createElement("input");
  imageFileInput.type = "file";
  imageFileInput.accept = "image/*";
  imageFileInput.hidden = true;
  uploadImageButton.addEventListener("click", () => imageFileInput.click());
  imageFileInput.addEventListener("change", async (event) => {
    const [file] = Array.from(event.target.files || []);
    const changed = await importArticleImageFile(article, file);
    imageFileInput.value = "";
    if (!changed) return;
    render();
  });
  imageActions.append(uploadImageButton, imageFileInput);

  const clearImageButton = document.createElement("button");
  clearImageButton.type = "button";
  clearImageButton.className = "ghost-btn homebrew-action-btn";
  clearImageButton.textContent = getUiText("homebrew_clear_image");
  clearImageButton.addEventListener("click", () => {
    updateArticleImage(article, "");
    render();
  });
  imageActions.appendChild(clearImageButton);
  imageField.appendChild(imageActions);

  const normalizedImageUrl = normalizeHomebrewUrl(article.imageUrl);
  if (normalizedImageUrl) {
    const imagePreview = document.createElement("div");
    imagePreview.className = "homebrew-editor-image-preview";
    imagePreview.style.backgroundImage = `url("${String(normalizedImageUrl).replace(/"/g, "\\\"")}")`;
    imageField.appendChild(imagePreview);
  }
  body.appendChild(imageField);

  const sourceInput = document.createElement("input");
  sourceInput.type = "url";
  sourceInput.className = "homebrew-editor-input";
  sourceInput.value = article.sourceUrl || "";
  sourceInput.placeholder = "https://";
  sourceInput.addEventListener("input", (event) => {
    updateArticleSource(article, event.target.value);
  });
  appendEditorField(body, getUiText("homebrew_field_source"), sourceInput);

  const categoriesField = document.createElement("div");
  categoriesField.className = "homebrew-editor-field";

  const categoriesLabel = document.createElement("span");
  categoriesLabel.className = "homebrew-editor-label";
  categoriesLabel.textContent = getUiText("homebrew_field_categories");
  categoriesField.appendChild(categoriesLabel);

  const selectedRow = document.createElement("div");
  selectedRow.className = "homebrew-editor-category-list homebrew-editor-category-list-selected";

  const selectedIds = Array.isArray(article.categoryIds) ? article.categoryIds : [];
  selectedIds
    .map((categoryId) => state.homebrewCategoriesData.find((entry) => entry.id === categoryId))
    .filter(Boolean)
    .forEach((category) => {
      const chip = document.createElement("div");
      chip.className = "homebrew-chip-wrap";

      const chipLabel = document.createElement("button");
      chipLabel.type = "button";
      chipLabel.className = "homebrew-chip active";
      chipLabel.textContent = getLocalizedCategoryTitle(category);
      chipLabel.addEventListener("click", () => {
        toggleArticleCategory(article, category.id);
      });
      chip.appendChild(chipLabel);

      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "homebrew-chip-icon";
      removeButton.textContent = "x";
      removeButton.title = getUiText("homebrew_remove_category_inline");
      removeButton.addEventListener("click", () => {
        toggleArticleCategory(article, category.id);
      });
      chip.appendChild(removeButton);
      selectedRow.appendChild(chip);
    });

  const addCategoryButton = document.createElement("button");
  addCategoryButton.type = "button";
  addCategoryButton.className = "homebrew-chip-icon";
  addCategoryButton.textContent = getUiText("homebrew_add_category_inline");
  addCategoryButton.title = getUiText("homebrew_add_category");
  addCategoryButton.addEventListener("click", () => {
    toggleArticleCategoryPicker(article.id);
  });
  selectedRow.appendChild(addCategoryButton);
  categoriesField.appendChild(selectedRow);

  if (isCategoryPickerOpen(article.id)) {
    const availableRow = document.createElement("div");
    availableRow.className = "homebrew-editor-category-list homebrew-editor-category-list-available";
    getSortedCategories()
      .filter((category) => !selectedIds.includes(category.id))
      .forEach((category) => {
        const categoryButton = document.createElement("button");
        categoryButton.type = "button";
        categoryButton.className = "homebrew-chip";
        categoryButton.textContent = getLocalizedCategoryTitle(category);
        categoryButton.addEventListener("click", () => {
          toggleArticleCategory(article, category.id);
        });
        availableRow.appendChild(categoryButton);
      });
    categoriesField.appendChild(availableRow);
  }

  body.appendChild(categoriesField);
}
