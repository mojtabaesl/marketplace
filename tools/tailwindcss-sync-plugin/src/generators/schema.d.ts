export interface UpdateTailwindGlobsGeneratorSchema {
  /**
   * (Optional) Limit to a single project by name.
   * If omitted, the generator auto-detects the invoking project (when run via syncGenerators)
   * or processes all app-like projects when run manually.
   */
  project?: string;

  /**
   * (Optional) Custom stylesheet path relative to the project root.
   * Defaults to <sourceRoot>/styles.css or src/styles.css.
   * Example: "src/styles/index.css"
   */
  stylesPath?: string;
}
