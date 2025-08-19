/* Writers CLI - Theme Selector and Editor Customization */

class ThemeSelector {
  constructor() {
    this.currentTheme = "light";
    this.themes = {
      light: {
        name: "Light",
        description: "Clean and bright",
        icon: "fa-sun",
        preview: "#ffffff",
      },
      dark: {
        name: "Dark",
        description: "Easy on the eyes",
        icon: "fa-moon",
        preview: "#1e293b",
      },
      "writer-warm": {
        name: "Writer Warm",
        description: "Cozy and comfortable",
        icon: "fa-fire",
        preview: "#faf8f5",
      },
      "forest-calm": {
        name: "Forest Calm",
        description: "Nature-inspired tranquility",
        icon: "fa-tree",
        preview: "#f8faf8",
      },
      sepia: {
        name: "Sepia",
        description: "Vintage book feel",
        icon: "fa-book",
        preview: "#f4f3ee",
      },
      nord: {
        name: "Nord",
        description: "Arctic coolness",
        icon: "fa-snowflake",
        preview: "#2e3440",
      },
      monokai: {
        name: "Monokai",
        description: "Developer classic",
        icon: "fa-code",
        preview: "#272822",
      },
      "high-contrast": {
        name: "High Contrast",
        description: "Maximum accessibility",
        icon: "fa-adjust",
        preview: "#000000",
      },
    };
    this.fontOptions = {
      "Crimson Text": "serif",
      "Libre Baskerville": "serif",
      "Playfair Display": "serif",
      Inter: "sans-serif",
      "Open Sans": "sans-serif",
      Lato: "sans-serif",
      "JetBrains Mono": "monospace",
      "Source Code Pro": "monospace",
      "Fira Code": "monospace",
    };
    this.settings = this.loadSettings();
  }

  init() {
    this.createThemeSelector();
    this.createEditorSettings();
    this.attachEventListeners();
    this.applySettings();
  }

  loadSettings() {
    const defaults = {
      theme: "light",
      fontFamily: "Crimson Text",
      fontSize: 16,
      lineHeight: 1.8,
      letterSpacing: 0.01,
      paragraphSpacing: 1.2,
      pageWidth: "comfortable", // comfortable, wide, narrow
      enableAnimations: true,
      showWordCount: true,
      showReadingTime: true,
      autoSave: true,
      typewriterMode: false,
      focusMode: false,
    };

    const saved = localStorage.getItem("writers-cli-theme-settings");
    return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
  }

  saveSettings() {
    localStorage.setItem(
      "writers-cli-theme-settings",
      JSON.stringify(this.settings),
    );
  }

  createThemeSelector() {
    // Create theme selector modal
    const themeModal = document.createElement("div");
    themeModal.id = "theme-selector-modal";
    themeModal.className = "modal theme-modal";
    themeModal.innerHTML = `
            <div class="modal-content theme-selector-content">
                <div class="modal-header">
                    <h3><i class="fas fa-palette"></i> Customize Your Writing Experience</h3>
                    <button class="modal-close" id="theme-modal-close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="theme-selector-body">
                    <div class="theme-section">
                        <h4><i class="fas fa-swatchbook"></i> Themes</h4>
                        <div class="theme-grid" id="theme-grid">
                            ${this.generateThemeCards()}
                        </div>
                    </div>

                    <div class="editor-section">
                        <h4><i class="fas fa-font"></i> Typography</h4>
                        <div class="settings-grid">
                            <div class="setting-group">
                                <label for="font-family-select">Font Family</label>
                                <select id="font-family-select" class="setting-select">
                                    ${this.generateFontOptions()}
                                </select>
                            </div>
                            <div class="setting-group">
                                <label for="font-size-slider">Font Size</label>
                                <input type="range" id="font-size-slider" class="setting-slider"
                                    min="12" max="24" value="${this.settings.fontSize}">
                                <span class="setting-value">${this.settings.fontSize}px</span>
                            </div>
                            <div class="setting-group">
                                <label for="line-height-slider">Line Height</label>
                                <input type="range" id="line-height-slider" class="setting-slider"
                                    min="1.2" max="2.5" step="0.1" value="${this.settings.lineHeight}">
                                <span class="setting-value">${this.settings.lineHeight}</span>
                            </div>
                            <div class="setting-group">
                                <label for="letter-spacing-slider">Letter Spacing</label>
                                <input type="range" id="letter-spacing-slider" class="setting-slider"
                                    min="-0.02" max="0.1" step="0.005" value="${this.settings.letterSpacing}">
                                <span class="setting-value">${this.settings.letterSpacing}em</span>
                            </div>
                        </div>
                    </div>

                    <div class="layout-section">
                        <h4><i class="fas fa-layout"></i> Layout</h4>
                        <div class="settings-grid">
                            <div class="setting-group">
                                <label for="page-width-select">Page Width</label>
                                <select id="page-width-select" class="setting-select">
                                    <option value="narrow">Narrow (80ch)</option>
                                    <option value="comfortable" selected>Comfortable (100ch)</option>
                                    <option value="wide">Wide (140ch)</option>
                                    <option value="full">Full Width</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div class="features-section">
                        <h4><i class="fas fa-magic"></i> Features</h4>
                        <div class="toggle-grid">
                            <div class="toggle-item">
                                <label class="toggle-label">
                                    <input type="checkbox" id="animations-toggle"
                                        ${this.settings.enableAnimations ? "checked" : ""}>
                                    <span class="toggle-slider"></span>
                                    <span class="toggle-text">
                                        <i class="fas fa-sparkles"></i>
                                        Smooth Animations
                                    </span>
                                </label>
                            </div>
                            <div class="toggle-item">
                                <label class="toggle-label">
                                    <input type="checkbox" id="word-count-toggle"
                                        ${this.settings.showWordCount ? "checked" : ""}>
                                    <span class="toggle-slider"></span>
                                    <span class="toggle-text">
                                        <i class="fas fa-calculator"></i>
                                        Show Word Count
                                    </span>
                                </label>
                            </div>
                            <div class="toggle-item">
                                <label class="toggle-label">
                                    <input type="checkbox" id="reading-time-toggle"
                                        ${this.settings.showReadingTime ? "checked" : ""}>
                                    <span class="toggle-slider"></span>
                                    <span class="toggle-text">
                                        <i class="fas fa-clock"></i>
                                        Show Reading Time
                                    </span>
                                </label>
                            </div>
                            <div class="toggle-item">
                                <label class="toggle-label">
                                    <input type="checkbox" id="auto-save-toggle"
                                        ${this.settings.autoSave ? "checked" : ""}>
                                    <span class="toggle-slider"></span>
                                    <span class="toggle-text">
                                        <i class="fas fa-save"></i>
                                        Auto Save
                                    </span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div class="preview-section">
                        <h4><i class="fas fa-eye"></i> Preview</h4>
                        <div class="preview-container">
                            <div class="preview-editor" id="preview-editor">
                                <p>The quick brown fox jumps over the lazy dog. This is how your text will look with the current settings.</p>
                                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="reset-settings-btn">
                        <i class="fas fa-undo"></i>
                        Reset to Defaults
                    </button>
                    <button class="btn btn-primary" id="apply-settings-btn">
                        <i class="fas fa-check"></i>
                        Apply Settings
                    </button>
                </div>
            </div>
        `;

    document.body.appendChild(themeModal);
  }

  generateThemeCards() {
    return Object.entries(this.themes)
      .map(
        ([key, theme]) => `
            <div class="theme-card ${key === this.settings.theme ? "active" : ""}"
                 data-theme="${key}">
                <div class="theme-preview" style="background-color: ${theme.preview}">
                    <i class="fas ${theme.icon}"></i>
                </div>
                <div class="theme-info">
                    <h5>${theme.name}</h5>
                    <p>${theme.description}</p>
                </div>
            </div>
        `,
      )
      .join("");
  }

  generateFontOptions() {
    return Object.entries(this.fontOptions)
      .map(
        ([font, type]) => `
            <option value="${font}" ${font === this.settings.fontFamily ? "selected" : ""}>
                ${font} (${type})
            </option>
        `,
      )
      .join("");
  }

  createEditorSettings() {
    // Add theme selector button to navbar
    const navbarActions = document.querySelector(".navbar-actions");
    if (navbarActions && !document.getElementById("theme-selector-btn")) {
      const themeBtn = document.createElement("button");
      themeBtn.id = "theme-selector-btn";
      themeBtn.className = "navbar-btn";
      themeBtn.title = "Customize Appearance";
      themeBtn.innerHTML = '<i class="fas fa-palette"></i>';
      navbarActions.insertBefore(themeBtn, navbarActions.firstChild);
    }

    // Add quick theme switcher to editor toolbar
    const editorToolbar = document.querySelector(".editor-toolbar");
    if (editorToolbar && !document.getElementById("quick-theme-btn")) {
      const quickThemeBtn = document.createElement("button");
      quickThemeBtn.id = "quick-theme-btn";
      quickThemeBtn.className = "btn btn-secondary";
      quickThemeBtn.innerHTML = '<i class="fas fa-palette"></i> Theme';
      editorToolbar.appendChild(quickThemeBtn);
    }
  }

  attachEventListeners() {
    // Theme selector button
    document.addEventListener("click", (e) => {
      if (
        e.target.matches("#theme-selector-btn, #quick-theme-btn") ||
        e.target.closest("#theme-selector-btn, #quick-theme-btn")
      ) {
        this.showThemeSelector();
      }

      // Close modal
      if (
        e.target.matches("#theme-modal-close") ||
        (e.target.matches("#theme-selector-modal") &&
          !e.target.closest(".modal-content"))
      ) {
        this.hideThemeSelector();
      }

      // Theme card selection
      if (e.target.closest(".theme-card")) {
        this.selectTheme(e.target.closest(".theme-card").dataset.theme);
      }

      // Apply settings
      if (e.target.matches("#apply-settings-btn")) {
        this.applySettings();
        this.hideThemeSelector();
      }

      // Reset settings
      if (e.target.matches("#reset-settings-btn")) {
        this.resetSettings();
      }
    });

    // Settings changes
    document.addEventListener("input", (e) => {
      if (e.target.matches(".setting-slider, .setting-select")) {
        this.updateSetting(e.target);
      }
    });

    // Toggle switches
    document.addEventListener("change", (e) => {
      if (e.target.matches("#animations-toggle")) {
        this.settings.enableAnimations = e.target.checked;
        this.updatePreview();
      }
      if (e.target.matches("#word-count-toggle")) {
        this.settings.showWordCount = e.target.checked;
      }
      if (e.target.matches("#reading-time-toggle")) {
        this.settings.showReadingTime = e.target.checked;
      }
      if (e.target.matches("#auto-save-toggle")) {
        this.settings.autoSave = e.target.checked;
      }
    });

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      // Ctrl/Cmd + , : Open theme selector
      if ((e.ctrlKey || e.metaKey) && e.key === ",") {
        e.preventDefault();
        this.showThemeSelector();
      }

      // Escape: Close theme selector
      if (
        e.key === "Escape" &&
        document.getElementById("theme-selector-modal").style.display === "flex"
      ) {
        this.hideThemeSelector();
      }
    });
  }

  showThemeSelector() {
    const modal = document.getElementById("theme-selector-modal");
    if (modal) {
      modal.style.display = "flex";
      document.body.style.overflow = "hidden";

      // Update current values
      this.updateFormValues();
      this.updatePreview();

      // Focus animation
      requestAnimationFrame(() => {
        modal.classList.add("show");
      });
    }
  }

  hideThemeSelector() {
    const modal = document.getElementById("theme-selector-modal");
    if (modal) {
      modal.classList.remove("show");
      setTimeout(() => {
        modal.style.display = "none";
        document.body.style.overflow = "";
      }, 300);
    }
  }

  selectTheme(themeName) {
    // Update UI
    document.querySelectorAll(".theme-card").forEach((card) => {
      card.classList.remove("active");
    });
    document
      .querySelector(`[data-theme="${themeName}"]`)
      .classList.add("active");

    // Update settings
    this.settings.theme = themeName;
    this.updatePreview();
  }

  updateSetting(element) {
    const value =
      element.type === "range" ? parseFloat(element.value) : element.value;

    switch (element.id) {
      case "font-family-select":
        this.settings.fontFamily = value;
        break;
      case "font-size-slider":
        this.settings.fontSize = value;
        element.nextElementSibling.textContent = `${value}px`;
        break;
      case "line-height-slider":
        this.settings.lineHeight = value;
        element.nextElementSibling.textContent = value;
        break;
      case "letter-spacing-slider":
        this.settings.letterSpacing = value;
        element.nextElementSibling.textContent = `${value}em`;
        break;
      case "page-width-select":
        this.settings.pageWidth = value;
        break;
    }

    this.updatePreview();
  }

  updateFormValues() {
    // Update sliders and selects with current values
    const fontSelect = document.getElementById("font-family-select");
    const fontSlider = document.getElementById("font-size-slider");
    const lineHeightSlider = document.getElementById("line-height-slider");
    const letterSpacingSlider = document.getElementById(
      "letter-spacing-slider",
    );
    const pageWidthSelect = document.getElementById("page-width-select");

    if (fontSelect) fontSelect.value = this.settings.fontFamily;
    if (fontSlider) {
      fontSlider.value = this.settings.fontSize;
      fontSlider.nextElementSibling.textContent = `${this.settings.fontSize}px`;
    }
    if (lineHeightSlider) {
      lineHeightSlider.value = this.settings.lineHeight;
      lineHeightSlider.nextElementSibling.textContent =
        this.settings.lineHeight;
    }
    if (letterSpacingSlider) {
      letterSpacingSlider.value = this.settings.letterSpacing;
      letterSpacingSlider.nextElementSibling.textContent = `${this.settings.letterSpacing}em`;
    }
    if (pageWidthSelect) pageWidthSelect.value = this.settings.pageWidth;
  }

  updatePreview() {
    const preview = document.getElementById("preview-editor");
    if (!preview) return;

    // Apply current settings to preview
    const styles = {
      fontFamily: this.settings.fontFamily,
      fontSize: `${this.settings.fontSize}px`,
      lineHeight: this.settings.lineHeight,
      letterSpacing: `${this.settings.letterSpacing}em`,
    };

    Object.assign(preview.style, styles);

    // Apply theme class to modal
    const modal = document.getElementById("theme-selector-modal");
    if (modal) {
      // Remove existing theme classes
      modal.className = modal.className.replace(/theme-[\w-]+/g, "");
      modal.classList.add(`theme-${this.settings.theme}`);
    }
  }

  applySettings() {
    // Apply theme to body
    document.body.className = document.body.className.replace(
      /theme-[\w-]+/g,
      "",
    );
    document.body.classList.add(`theme-${this.settings.theme}`);

    // Apply typography settings to CSS custom properties
    document.documentElement.style.setProperty(
      "--editor-font-family",
      this.settings.fontFamily,
    );
    document.documentElement.style.setProperty(
      "--editor-font-size",
      `${this.settings.fontSize}px`,
    );
    document.documentElement.style.setProperty(
      "--editor-line-height",
      this.settings.lineHeight,
    );
    document.documentElement.style.setProperty(
      "--editor-letter-spacing",
      `${this.settings.letterSpacing}em`,
    );

    // Apply page width
    this.applyPageWidth();

    // Save settings
    this.saveSettings();

    // Show confirmation
    this.showNotification(
      "Theme and settings applied successfully!",
      "success",
    );
  }

  applyPageWidth() {
    const editors = document.querySelectorAll(
      ".editor-textarea, .focus-mode-textarea",
    );
    const widthMap = {
      narrow: "80ch",
      comfortable: "100ch",
      wide: "140ch",
      full: "100%",
    };

    const maxWidth = widthMap[this.settings.pageWidth] || "100ch";

    editors.forEach((editor) => {
      if (this.settings.pageWidth === "full") {
        editor.style.maxWidth = "none";
        editor.style.width = "100%";
      } else {
        editor.style.maxWidth = maxWidth;
        editor.style.width = "100%";
        editor.style.marginLeft = "auto";
        editor.style.marginRight = "auto";
      }
    });
  }

  resetSettings() {
    if (confirm("Are you sure you want to reset all settings to defaults?")) {
      // Clear saved settings
      localStorage.removeItem("writers-cli-theme-settings");

      // Reload default settings
      this.settings = this.loadSettings();

      // Update form
      this.updateFormValues();
      this.updatePreview();

      // Show confirmation
      this.showNotification("Settings reset to defaults", "info");
    }
  }

  showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.className = `theme-notification ${type}`;
    notification.innerHTML = `
            <i class="fas fa-${type === "success" ? "check" : "info"}-circle"></i>
            ${message}
        `;

    Object.assign(notification.style, {
      position: "fixed",
      top: "20px",
      right: "20px",
      padding: "12px 16px",
      background: type === "success" ? "#10b981" : "#06b6d4",
      color: "white",
      borderRadius: "8px",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
      zIndex: "10001",
      transform: "translateX(100%)",
      transition: "transform 0.3s ease",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      fontWeight: "500",
    });

    document.body.appendChild(notification);

    requestAnimationFrame(() => {
      notification.style.transform = "translateX(0)";
    });

    setTimeout(() => {
      notification.style.transform = "translateX(100%)";
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // Public methods
  getCurrentTheme() {
    return this.settings.theme;
  }

  setTheme(themeName) {
    if (this.themes[themeName]) {
      this.selectTheme(themeName);
      this.applySettings();
    }
  }

  getSettings() {
    return { ...this.settings };
  }

  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
    this.applySettings();
  }
}

// Initialize theme selector
document.addEventListener("DOMContentLoaded", () => {
  window.themeSelector = new ThemeSelector();
  window.themeSelector.init();
});

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = ThemeSelector;
}
