import { registerFn } from "../common/plugin-element-cache";
import pluginInfo from "../plugin-manifest.json";
import cssString from "inline:./style.css";

registerFn(pluginInfo, (handler) => {
  /**
   * Add plugin styles to the head of the document
   */
  if (!document.getElementById(`${pluginInfo.id}-styles`)) {
    const style = document.createElement("style");
    style.id = `${pluginInfo.id}-styles`;
    style.textContent = cssString;
    document.head.appendChild(style);
  }

  // Listen for sidebar-panel::add events to intercept sidebar rendering
  handler.on("flotiq.form.sidebar-panel::add", ({ contentObject }) => {
    // Create div HTML element
    const div = document.createElement("div");

    // Add link inside
    div.innerHTML = `
          <a target="_blank" href="https://my.page.com/${contentObject.slug}">Preview</a>
      `;
    div.classList.add("button-for-marketplace");

    return div;
  });
});
