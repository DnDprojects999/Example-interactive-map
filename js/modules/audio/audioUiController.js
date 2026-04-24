export function createAudioUiController(options) {
  const {
    els,
    state,
    getUiText,
    getSettings,
    getCurrentMode,
    getSelectedModeTarget,
  } = options;

  function syncUi() {
    const settings = getSettings();
    if (els.audioEditorSection) {
      els.audioEditorSection.hidden = !state.editMode;
      els.audioEditorSection.toggleAttribute("hidden", !state.editMode);
    }
    els.audioToggleButton.title = getUiText(state, "audio_button_title");
    els.audioToggleButton.setAttribute("aria-label", getUiText(state, "audio_button_title"));
    els.audioPopoverKicker.textContent = getUiText(state, "audio_menu_title");
    els.audioEnabledButton.textContent = getUiText(state, settings.enabled ? "audio_enabled_on" : "audio_enabled_off");
    els.audioUiButton.textContent = getUiText(state, settings.uiEnabled ? "audio_ui_on" : "audio_ui_off");
    els.audioAmbienceButton.textContent = getUiText(state, settings.ambienceEnabled ? "audio_ambience_on" : "audio_ambience_off");
    els.audioMasterLabel.textContent = getUiText(state, "audio_master_volume");
    els.audioUiVolumeLabel.textContent = getUiText(state, "audio_ui_volume");
    els.audioAmbienceVolumeLabel.textContent = getUiText(state, "audio_ambience_volume");
    els.audioEditorKicker.textContent = getUiText(state, "audio_editor_title");
    els.audioModeTargetLabel.textContent = getUiText(state, "audio_mode_target");
    els.audioPreviewClickButton.textContent = getUiText(state, "audio_preview_click");
    els.audioPreviewOpenButton.textContent = getUiText(state, "audio_preview_open");
    els.audioPreviewAmbienceButton.textContent = getUiText(state, "audio_preview_ambience");
    els.audioSaveDefaultsButton.textContent = getUiText(state, "audio_save_defaults");
    els.audioResetLocalButton.textContent = getUiText(state, "audio_reset_local");
    els.audioUploadUiButton.textContent = getUiText(state, "audio_upload_ui");
    els.audioClearUiButton.textContent = getUiText(state, "audio_clear_ui");
    els.audioUploadOpenButton.textContent = getUiText(state, "audio_upload_open");
    els.audioClearOpenButton.textContent = getUiText(state, "audio_clear_open");
    els.audioUploadAmbienceButton.textContent = getUiText(state, "audio_upload_ambience");
    els.audioClearAmbienceButton.textContent = getUiText(state, "audio_clear_ambience");
    els.audioMasterVolumeInput.value = String(Math.round(settings.masterVolume * 100));
    els.audioUiVolumeInput.value = String(Math.round(settings.uiVolume * 100));
    els.audioAmbienceVolumeInput.value = String(Math.round(settings.ambienceVolume * 100));
    els.audioToggleButton.classList.toggle("muted", !settings.enabled);
    els.audioToggleLabel.textContent = settings.enabled ? "\u266a" : "\u266c";

    const modeLabels = {
      map: getUiText(state, "mode_map"),
      timeline: getUiText(state, "mode_timeline"),
      archive: getUiText(state, "mode_archive"),
      homebrew: getUiText(state, "mode_homebrew"),
      heroes: getUiText(state, "mode_heroes"),
    };

    Array.from(els.audioModeTargetSelect?.options || []).forEach((option) => {
      const hasCustomAmbience = Boolean(String(settings.ambienceByMode?.[option.value] || "").trim());
      option.textContent = `${modeLabels[option.value] || option.value}${hasCustomAmbience ? " \u2022" : ""}`;
    });

    if (els.audioModeTargetSelect && !els.audioModeTargetSelect.value) {
      els.audioModeTargetSelect.value = getCurrentMode();
    }
    if (els.audioModeStatus) {
      const selectedMode = getSelectedModeTarget();
      const hasCustomAmbience = Boolean(String(settings.ambienceByMode?.[selectedMode] || "").trim());
      els.audioModeStatus.textContent = getUiText(
        state,
        hasCustomAmbience ? "audio_mode_status_custom" : "audio_mode_status_builtin",
      );
    }
  }

  return { syncUi };
}
