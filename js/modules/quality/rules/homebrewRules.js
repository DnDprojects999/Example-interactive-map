import {
  AUDIT_LIMITS,
  reportBlankField,
  reportLengthField,
  registerEntityId,
} from "../utils.js";

export function auditHomebrewCategory(issues, registry, category) {
  const target = { type: "homebrewCategory", id: category.id };
  registerEntityId(registry, "homebrewCategory", "категорий homebrew", category.id, target);

  reportBlankField(issues, "homebrew", "blank-homebrew-category", category.title, category.id, target);
  reportLengthField(issues, "homebrew", "long-title", category.title, category.title, target, AUDIT_LIMITS.title);
}

export function auditHomebrewArticle(issues, registry, article) {
  const target = { type: "homebrewArticle", id: article.id };
  registerEntityId(registry, "homebrewArticle", "статей homebrew", article.id, target);

  reportBlankField(issues, "homebrew", "blank-homebrew-title", article.title, article.id, target);
  reportBlankField(issues, "homebrew", "blank-homebrew-summary", article.summary, article.title || article.id, target);
  reportBlankField(issues, "homebrew", "blank-homebrew-content", article.content, article.title || article.id, target);
  reportLengthField(issues, "homebrew", "long-title", article.title, article.title, target, AUDIT_LIMITS.title);
}
