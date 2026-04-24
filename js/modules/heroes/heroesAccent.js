export const DEFAULT_HERO_ACCENT = "#b98a4b";

function rgbToHex(r, g, b) {
  return `#${[r, g, b].map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

function readDominantColor(image) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;

  const size = 24;
  canvas.width = size;
  canvas.height = size;
  context.drawImage(image, 0, 0, size, size);
  const pixels = context.getImageData(0, 0, size, size).data;
  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;

  for (let index = 0; index < pixels.length; index += 4) {
    const alpha = pixels[index + 3];
    if (alpha < 80) continue;
    const red = pixels[index];
    const green = pixels[index + 1];
    const blue = pixels[index + 2];
    const max = Math.max(red, green, blue);
    const min = Math.min(red, green, blue);
    if (max < 35 || max - min < 8) continue;
    r += red;
    g += green;
    b += blue;
    count += 1;
  }

  if (!count) return null;
  return rgbToHex(Math.round(r / count), Math.round(g / count), Math.round(b / count));
}

export function getResolvedHeroAccent(hero, dominantColor = "") {
  return hero?.accentColorOverride || dominantColor || hero?.accentColor || DEFAULT_HERO_ACCENT;
}

export function applyHeroAccentPalette(root, state) {
  const nodes = root.matches?.(".hero-card, .hero-expanded")
    ? [root, ...root.querySelectorAll(".hero-card, .hero-expanded")]
    : [...root.querySelectorAll(".hero-card, .hero-expanded")];

  nodes.forEach((node) => {
    const group = state.heroesData.find((entry) => entry.id === node.dataset.groupId);
    const hero = group?.items?.find((entry) => entry.id === node.dataset.heroId);
    const image = node.querySelector("img");

    if (!hero || !image) {
      node.style.setProperty("--hero-accent", getResolvedHeroAccent(hero));
      return;
    }

    if (hero.accentColorOverride) {
      node.style.setProperty("--hero-accent", getResolvedHeroAccent(hero));
      return;
    }

    const updateColor = () => {
      try {
        const color = readDominantColor(image);
        node.style.setProperty("--hero-accent", getResolvedHeroAccent(hero, color));
      } catch (error) {
        node.style.setProperty("--hero-accent", getResolvedHeroAccent(hero));
      }
    };

    if (image.complete) {
      updateColor();
    } else {
      image.addEventListener("load", updateColor, { once: true });
      image.addEventListener(
        "error",
        () => {
          node.style.setProperty("--hero-accent", getResolvedHeroAccent(hero));
        },
        { once: true },
      );
    }
  });
}
