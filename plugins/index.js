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
    if (!contentObject?.slug) return null;
    // Create div HTML element
    const div = document.createElement("div");

    // Add link inside
    div.innerHTML = `
          <a target="_blank" href="https://my.page.com/${contentObject.slug}">Preview</a>
      `;
    div.classList.add("button-for-marketplace");

    return div;
  });

  handler.on("flotiq.plugins.manage::form-schema", () => {
    return {
      schema: {
        id: pluginInfo.id,
        schemaDefinition: {
          type: "object",
          allOf: [
            {
              $ref: "#/components/schemas/AbstractContentTypeSchemaDefinition",
            },
            {
              type: "object",
              properties: {
                text: {
                  type: "string",
                  minLength: 1,
                },
              },
            },
          ],
          required: ["text"],
          additionalProperties: false,
        },
        metaDefinition: {
          order: ["text"],
          propertiesConfig: {
            text: {
              label: "Text",
              unique: false,
              helpText: "",
              inputType: "text",
            },
          },
        },
      },
    };
  });
});
