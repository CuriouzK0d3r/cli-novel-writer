const BufferEditor = require("./buffer-editor");

class WritersEditor {
  constructor() {
    this.bufferEditor = new BufferEditor();
  }

  /**
   * Initialize and launch the editor
   */
  async launch(filePath = null) {
    return await this.bufferEditor.launch(filePath);
  }
}

module.exports = WritersEditor;
