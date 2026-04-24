import { normalizeHomebrewUrl, stopHomebrewEvent } from "./homebrewShared.js";

export function createHomebrewViewController(options) {
  const {
    els,
    state,
    getUiText,
    getTypeLabel,
    getLocalizedCategoryTitle,
    getLocalizedArticleText,
    getVisibleArticles,
    getSortedCategories,
    buildCategoryMeta,
    isArticleEditing,
    isCategoryEditing,
    renderArticleEditor,
    renderExpandedArticleBody,
    editCategory,
    updateCategoryTitle,
    closeCategoryEditor,
    deleteCategory,
    openArticleEditor,
    closeArticleEditor,
    deleteArticle,
    render,
  } = options;

  function renderCategories() {
    els.homebrewCategories.innerHTML = "";

    const allButton = document.createElement("button");
    allButton.type = "button";
    allButton.className = "homebrew-chip";
    allButton.textContent = getUiText("homebrew_all_categories");
    allButton.classList.toggle("active", String(state.currentHomebrewCategoryId || "all") === "all");
    allButton.addEventListener("click", () => {
      state.currentHomebrewCategoryId = "all";
      render();
    });
    els.homebrewCategories.appendChild(allButton);

    getSortedCategories().forEach((category) => {
      const chip = document.createElement("div");
      chip.className = "homebrew-chip-wrap";

      if (isCategoryEditing(category.id)) {
        const input = document.createElement("input");
        input.type = "text";
        input.className = "homebrew-chip-input";
        input.value = getLocalizedCategoryTitle(category);
        input.placeholder = getUiText("prompt_homebrew_category_title");
        input.addEventListener("input", (event) => {
          updateCategoryTitle(category, event.target.value);
        });
        input.addEventListener("keydown", (event) => {
          if (event.key === "Enter") {
            stopHomebrewEvent(event);
            closeCategoryEditor();
            return;
          }
          if (event.key === "Escape") {
            stopHomebrewEvent(event);
            closeCategoryEditor();
          }
        });
        input.addEventListener("blur", () => {
          closeCategoryEditor();
        });
        chip.appendChild(input);

        requestAnimationFrame(() => {
          input.focus();
          input.select();
        });
      } else {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "homebrew-chip";
        button.textContent = getLocalizedCategoryTitle(category);
        button.classList.toggle("active", state.currentHomebrewCategoryId === category.id);
        button.addEventListener("click", () => {
          state.currentHomebrewCategoryId = category.id;
          render();
        });
        chip.appendChild(button);
      }

      if (state.editMode) {
        if (isCategoryEditing(category.id)) {
          const doneButton = document.createElement("button");
          doneButton.type = "button";
          doneButton.className = "homebrew-chip-icon";
          doneButton.textContent = "OK";
          doneButton.title = getUiText("homebrew_edit_done");
          doneButton.addEventListener("mousedown", (event) => {
            stopHomebrewEvent(event);
            closeCategoryEditor();
          });
          chip.appendChild(doneButton);
        } else {
          const editButton = document.createElement("button");
          editButton.type = "button";
          editButton.className = "homebrew-chip-icon";
          editButton.textContent = "E";
          editButton.title = getUiText("homebrew_edit");
          editButton.addEventListener("click", (event) => {
            stopHomebrewEvent(event);
            editCategory(category.id);
          });
          chip.appendChild(editButton);
        }

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "homebrew-chip-icon";
        deleteButton.textContent = "X";
        deleteButton.title = getUiText("homebrew_delete");
        deleteButton.addEventListener("click", (event) => {
          stopHomebrewEvent(event);
          deleteCategory(category.id);
        });
        chip.appendChild(deleteButton);
      }

      els.homebrewCategories.appendChild(chip);
    });
  }

  function renderArticles() {
    const visibleArticles = getVisibleArticles();
    if (!visibleArticles.some((entry) => entry.id === state.currentHomebrewArticleId)) {
      state.currentHomebrewArticleId = null;
    }
    if (!visibleArticles.some((entry) => entry.id === state.currentHomebrewEditingArticleId)) {
      state.currentHomebrewEditingArticleId = null;
    }

    els.homebrewArticles.innerHTML = "";

    if (!visibleArticles.length) {
      const emptyState = document.createElement("div");
      emptyState.className = "homebrew-empty";

      const title = document.createElement("h2");
      title.textContent = getUiText("homebrew_empty_title");
      emptyState.appendChild(title);

      const text = document.createElement("p");
      text.textContent = getUiText("homebrew_empty_text");
      emptyState.appendChild(text);

      els.homebrewArticles.appendChild(emptyState);
      return;
    }

    visibleArticles.forEach((article) => {
      const expanded = article.id === state.currentHomebrewArticleId;
      const editing = isArticleEditing(article.id);

      const card = document.createElement("article");
      card.className = "homebrew-article-card";
      if (expanded) card.classList.add("expanded");

      const header = document.createElement(editing ? "div" : "button");
      header.className = "homebrew-article-header";
      if (!editing) {
        header.type = "button";
        header.addEventListener("click", () => {
          state.currentHomebrewArticleId = expanded ? null : article.id;
          render();
        });
      }

      const meta = document.createElement("div");
      meta.className = "homebrew-article-meta";
      meta.textContent = [getTypeLabel(article.type), buildCategoryMeta(article)].filter(Boolean).join(" · ");
      header.appendChild(meta);

      const title = document.createElement("h2");
      title.className = "homebrew-article-title";
      title.textContent = getLocalizedArticleText(article, "title", "Homebrew");
      header.appendChild(title);

      const summary = document.createElement("p");
      summary.className = "homebrew-article-summary";
      summary.textContent = getLocalizedArticleText(article, "summary", "");
      header.appendChild(summary);

      if (state.editMode) {
        const actions = document.createElement("div");
        actions.className = "homebrew-article-actions";

        const primaryButton = document.createElement("button");
        primaryButton.type = "button";
        primaryButton.className = "ghost-btn homebrew-action-btn";
        primaryButton.textContent = editing
          ? getUiText("homebrew_edit_done")
          : getUiText("homebrew_edit");
        primaryButton.addEventListener("click", (event) => {
          stopHomebrewEvent(event);
          if (editing) {
            closeArticleEditor();
            return;
          }
          openArticleEditor(article.id);
        });
        actions.appendChild(primaryButton);

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "ghost-btn homebrew-action-btn";
        deleteButton.textContent = getUiText("homebrew_delete");
        deleteButton.addEventListener("click", (event) => {
          stopHomebrewEvent(event);
          deleteArticle(article.id);
        });
        actions.appendChild(deleteButton);

        header.appendChild(actions);
      }

      card.appendChild(header);

      const body = document.createElement("div");
      body.className = "homebrew-article-body";
      if (!expanded) body.hidden = true;

      if (editing) {
        renderArticleEditor(article, body);
      } else {
        renderExpandedArticleBody(article, body);
      }

      card.appendChild(body);
      els.homebrewArticles.appendChild(card);
    });
  }

  return {
    renderArticles,
    renderCategories,
  };
}
