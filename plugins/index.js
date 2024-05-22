import { registerFn } from "../common/plugin-element-cache";
import pluginInfo from "../plugin-manifest.json";
import cssString from "inline:./style.css";
import semver from "semver";

const settingsMigrations = [
  {
    from: "1.4.2",
    to: "1.4.3",
    migration: (settings) => {
      settings.last_seen_version = "1.4.3";
      settings.field_from_1_4_2 = "migrated";
      return settings;
    },
  },
  {
    from: "1.4.3",
    to: "1.5.0",
    migration: (settings) => {
      settings.last_seen_version = "1.5.0";
      settings.field_from_1_5 = "migrated";
      settings.somefield = 123;
      return settings;
    },
  },
  {
    from: "1.5.1",
    to: "1.5.2",
    migration: (settings) => {
      settings.last_seen_version = "1.5.2";
      settings.field_from_1_5 = "migrated 2";
      return settings;
    },
  },
  {
    from: "1.5.7",
    to: "1.5.8",
    migration: async (settings, { openSchemaModal }) => {
      const petName = await openSchemaModal({
        title: "Whats your pets name?",
        form: {
          schema: {
            id: "mycompany.pet-modal",
            schemaDefinition: {
              type: "object",
              allOf: [
                {
                  $ref: "#/components/schemas/AbstractContentTypeSchemaDefinition",
                },
                {
                  type: "object",
                  properties: {
                    pet_name: {
                      type: "string",
                      minLength: 1,
                    },
                  },
                },
              ],
              required: ["pet_name"],
              additionalProperties: false,
            },
            metaDefinition: {
              order: ["pet_name"],
              propertiesConfig: {
                pet_name: {
                  label: "Pet Name",
                  unique: false,
                  helpText: "",
                  inputType: "text",
                },
              },
            },
          },
        },
      });
      settings.last_seen_version = "1.5.8";
      settings.petName = petName.pet_name;
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
      return settings;
    },
  );

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
