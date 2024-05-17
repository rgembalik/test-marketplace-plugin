import { registerFn } from "../common/plugin-element-cache";
import pluginInfo from "../plugin-manifest.json";
import cssString from "inline:./style.css";
import semver from "semver";

const settingsMigrations = [
  {
    from: "1.4.2",
    to: "1.4.3",
    migration: (settings) => {
      settings.version = "1.4.3";
      settings.field_from_1_4_2 = "migrated";
      return settings;
    },
  },
  {
    from: "1.4.3",
    to: "1.5.0",
    migration: (settings) => {
      settings.version = "1.5.0";
      settings.field_from_1_5 = "migrated";
      settings.somefield = 123;
      return settings;
    },
  },
  {
    from: "1.5.1",
    to: "1.5.2",
    migration: (settings) => {
      settings.version = "1.5.2";
      settings.field_from_1_5 = "migrated 2";
      return settings;
    },
  },
];

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

  handler.on("flotiq.plugins::update", ({ previousVersion, newVersion }) => {
    console.log("previousVersion, newVersion", previousVersion, newVersion);

    let settings = previousVersion.settings
      ? JSON.parse(previousVersion.settings)
      : {};
    let versionNumber = previousVersion.version;

    let migration;
    while (
      (migration = settingsMigrations.find(
        (m) =>
          // migration.from <= versionNumber < migration.to
          semver.gte(m.from, versionNumber) && semver.lt(versionNumber, m.to),
      ))
    ) {
      console.log("Applying migration", migration.from, "=>", migration.to);
      settings = migration.migration(settings);
      versionNumber = migration.to;
    }
    console.log("Final settings", settings);
    return settings;
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
