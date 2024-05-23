import { registerFn } from "../common/plugin-element-cache";
import pluginInfo from "../plugin-manifest.json";
import cssString from "inline:./style.css";
import semver from "semver";

const settingsMigrations = [
  {
    from: "1.0.0",
    to: "1.1.0",
    migration: async () => {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      return {
        last_seen_version: "1.0.0",
        field_to_update: "It's string",
      };
    },
  },
  {
    from: "1.1.0",
    to: "1.1.1",
    migration: (settings) => {
      settings.last_seen_version = "1.1.0";
      settings.field_to_update += " that is combined with value";
      return settings;
    },
  },
  {
    from: "1.1.1",
    to: "1.1.2",
    migration: (settings) => {
      settings.last_seen_version = "1.1.1";
      settings.field_to_update += " from previous version.";
      return settings;
    },
  },
  {
    from: "1.1.2",
    to: "1.2.0",
    migration: async (settings, { openSchemaModal }) => {
      const modalForm = await openSchemaModal({
        size: "xl",
        title: "You can now update this field here!",
        form: {
          schema: {
            id: "mycompany.migration-update",
            schemaDefinition: {
              type: "object",
              allOf: [
                {
                  $ref: "#/components/schemas/AbstractContentTypeSchemaDefinition",
                },
                {
                  type: "object",
                  properties: {
                    field_to_update: {
                      type: "string",
                      minLength: 1,
                    },
                  },
                },
              ],
              required: ["field_to_update"],
              additionalProperties: false,
            },
            metaDefinition: {
              order: ["field_to_update"],
              propertiesConfig: {
                field_to_update: {
                  label: "Field to update",
                  unique: false,
                  helpText: "",
                  inputType: "text",
                },
              },
            },
          },
        },
      });
      settings.last_seen_version = "1.1.2";
      settings.field_to_update += " And this is value that user provided: ";
      settings.field_to_update += modalForm.field_to_update;
      return settings;
    },
  },
];

registerFn(pluginInfo, (handler, _, globals) => {
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

  handler.on(
    "flotiq.plugin::migrate",
    async ({ previousVersion, newVersion }) => {
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
        settings = await migration.migration(settings, globals);
        versionNumber = migration.to;
      }
      console.log("Final settings", settings);
      return JSON.stringify(settings);
    },
  );

  handler.on("flotiq.plugins.manage::form-schema", () => {
    return {
      schema: {
        id: "test-plugin-settings",
        name: "test_plugin",
        label: "test plugin",
        workflowId: "generic",
        internal: false,
        schemaDefinition: {
          type: "object",
          allOf: [
            {
              $ref: "#/components/schemas/AbstractContentTypeSchemaDefinition",
            },
            {
              type: "object",
              properties: {
                field_to_update: {
                  type: "string",
                },
                last_seen_version: {
                  type: "string",
                  default: "1.0.0",
                },
              },
            },
          ],
          required: [],
          additionalProperties: false,
        },
        metaDefinition: {
          order: ["last_seen_version", "field_to_update"],
          propertiesConfig: {
            field_to_update: {
              label: "Field to update",
              unique: false,
              helpText: "",
              readonly: true,
              inputType: "text",
              default: "",
            },
            last_seen_version: {
              label: "Last seen version",
              unique: false,
              helpText: "",
              readonly: true,
              inputType: "text",
            },
          },
        },
      },
    };
  });
});
