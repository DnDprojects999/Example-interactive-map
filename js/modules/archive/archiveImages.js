import { getLocalizedText } from "../localization.js";
import { getUiText } from "../uiLocale.js";

// Archive supports per-map-mode image variants so the same card can show
// different art in author/vector-style presentations.
export function getArchiveImageVariantKey(mapViewMode) {
  return mapViewMode === "author" ? "author" : "interactive";
}

export function ensureArchiveImageVariants(item, fieldName = "imageVariants") {
  if (!item || typeof item !== "object") return;
  if (!item[fieldName] || typeof item[fieldName] !== "object") item[fieldName] = {};
}

export function getArchiveItemImageUrl(item, mapViewMode) {
  const variantKey = getArchiveImageVariantKey(mapViewMode);
  const variantUrl = item?.imageVariants?.[variantKey]?.trim?.() || "";
  if (variantUrl) return variantUrl;
  return item?.imageUrl?.trim?.() || "";
}

export function getArchiveItemExpandedImageUrl(item, mapViewMode, { fallbackToCard = true } = {}) {
  // Expanded art falls back to card art when no dedicated expanded image was
  // provided, which keeps archive cards usable with minimal setup.
  const variantKey = getArchiveImageVariantKey(mapViewMode);
  const variantUrl = item?.expandedImageVariants?.[variantKey]?.trim?.() || "";
  if (variantUrl) return variantUrl;

  const directUrl = item?.expandedImageUrl?.trim?.() || "";
  if (directUrl) return directUrl;

  return fallbackToCard ? getArchiveItemImageUrl(item, mapViewMode) : "";
}

function appendImagePreview(imageNode, { src, alt, className }) {
  const preview = document.createElement("img");
  preview.className = className;
  preview.src = src;
  preview.alt = alt;
  preview.loading = "lazy";
  preview.decoding = "async";
  imageNode.appendChild(preview);
}

export function renderArchiveCardImage(imageNode, item, mapViewMode, localizationContext = null) {
  imageNode.innerHTML = "";
  const imageUrl = getArchiveItemImageUrl(item, mapViewMode);
  if (!imageUrl) {
    imageNode.textContent = getLocalizedText(item, "imageLabel", localizationContext, getUiText(localizationContext, "archive_image_fallback"));
    return;
  }

  appendImagePreview(imageNode, {
    src: imageUrl,
    alt: getLocalizedText(
      item,
      "imageLabel",
      localizationContext,
      getLocalizedText(item, "title", localizationContext, getUiText(localizationContext, "archive_card_illustration")),
    ),
    className: "archive-card-image-preview",
  });
}

export function renderArchiveExpandedImage(imageNode, item, mapViewMode, localizationContext = null) {
  imageNode.innerHTML = "";
  const imageUrl = getArchiveItemExpandedImageUrl(item, mapViewMode);
  if (!imageUrl) {
    imageNode.textContent = getLocalizedText(
      item,
      "expandedImageLabel",
      localizationContext,
      getLocalizedText(item, "imageLabel", localizationContext, getUiText(localizationContext, "archive_image_fallback")),
    );
    return;
  }

  appendImagePreview(imageNode, {
    src: imageUrl,
    alt: getLocalizedText(
      item,
      "expandedImageLabel",
      localizationContext,
      getLocalizedText(
        item,
        "imageLabel",
        localizationContext,
        getLocalizedText(item, "title", localizationContext, getUiText(localizationContext, "archive_expanded_illustration")),
      ),
    ),
    className: "archive-expanded-image",
  });
}
