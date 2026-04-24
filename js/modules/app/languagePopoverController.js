export function createLanguagePopoverController(options) {
  const { els } = options;

  function setOpen(isOpen) {
    if (isOpen) {
      els.languagePopover.removeAttribute("hidden");
      position();
      window.requestAnimationFrame(position);
    } else {
      els.languagePopover.setAttribute("hidden", "");
    }
    els.languageToggleButton.setAttribute("aria-expanded", String(isOpen));
  }

  function isOpen() {
    return !els.languagePopover.hasAttribute("hidden");
  }

  function close() {
    setOpen(false);
  }

  function position() {
    // The popover is positioned in viewport coordinates so it stays attached to
    // the toggle even when the page layout changes.
    if (els.languagePopover.hasAttribute("hidden")) return;

    const rect = els.languageToggleButton.getBoundingClientRect();
    const viewportPadding = 12;
    const popoverWidth = Math.max(220, els.languagePopover.offsetWidth || 220);
    const centeredLeft = rect.left + (rect.width / 2) - (popoverWidth / 2);
    const clampedLeft = Math.min(
      Math.max(centeredLeft, viewportPadding),
      Math.max(viewportPadding, window.innerWidth - popoverWidth - viewportPadding),
    );

    els.languagePopover.style.position = "fixed";
    els.languagePopover.style.top = `${rect.bottom + 10}px`;
    els.languagePopover.style.left = `${clampedLeft}px`;
    els.languagePopover.style.right = "auto";
    els.languagePopover.style.transform = "none";
  }

  return {
    close,
    isOpen,
    position,
    setOpen,
  };
}
