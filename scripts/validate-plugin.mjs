/**
 * Validate this repository as an Agent Plugins 1.0.0 package.
 *
 * The specification publishes JSON Schemas and does not ship a validator CLI
 * (a standard linter is listed under future considerations). This script
 * fetches the canonical 1.0.0 schemas and checks the extra semantic rules
 * those schemas do not express: matching schema versions, remote URL form,
 * and Agent Skills frontmatter.
 */
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";

const PLUGIN_SCHEMA_URL = "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json";
const MCP_SCHEMA_URL = "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json";
const SPEC_VERSION = "1.0.0";

const SKILL_NAME = /^(?!.*--)[a-z0-9]+(?:-[a-z0-9]+)*$/;

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function fetchSchema(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

function schemaVersion(schemaId) {
  const match = String(schemaId).match(/\/schemas\/(\d+\.\d+\.\d+)\//);
  return match ? match[1] : null;
}

function formatErrors(validate) {
  return (validate.errors ?? [])
    .map((error) => `${error.instancePath || "/"} ${error.message}`)
    .join("; ");
}

function isLoopback(hostname) {
  const host = hostname.toLowerCase();
  if (host === "localhost" || host === "::1") return true;
  if (host.startsWith("127.")) return true;
  return false;
}

function validateRemoteUrl(urlString, label) {
  let url;
  try {
    url = new URL(urlString);
  } catch {
    return `${label} is not an absolute URL`;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return `${label} must be an HTTP or HTTPS URL`;
  }
  if (url.username || url.password) {
    return `${label} must not contain user information`;
  }
  if (url.hash) {
    return `${label} must not contain a fragment`;
  }
  if (url.protocol === "http:" && !isLoopback(url.hostname)) {
    return `${label} must use HTTPS for a non-loopback host`;
  }
  return null;
}

async function validateSkills(errors) {
  const skillsDir = path.join(root, "skills");
  let entries;
  try {
    entries = await readdir(skillsDir, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") return;
    throw error;
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      errors.push(`skills/${entry.name} is not a skill directory`);
      continue;
    }
    const skillPath = path.join(skillsDir, entry.name, "SKILL.md");
    let text;
    try {
      text = await readFile(skillPath, "utf8");
    } catch (error) {
      if (error.code === "ENOENT") {
        errors.push(`skills/${entry.name} has no SKILL.md`);
        continue;
      }
      throw error;
    }

    const frontmatter = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!frontmatter) {
      errors.push(`skills/${entry.name}/SKILL.md is missing YAML frontmatter`);
      continue;
    }
    const name = frontmatter[1].match(/^name:\s*(.+)$/m)?.[1]?.trim();
    const description = frontmatter[1].match(/^description:\s*(.+)$/m)?.[1]?.trim();
    if (name !== entry.name) {
      errors.push(`skills/${entry.name} name ${JSON.stringify(name)} must match the directory`);
    } else if (!SKILL_NAME.test(name) || name.length > 64) {
      errors.push(`skills/${entry.name} name does not match the Agent Skills name grammar`);
    }
    if (!description) {
      errors.push(`skills/${entry.name} is missing a description`);
    } else if (description.length > 1024) {
      errors.push(`skills/${entry.name} description is longer than 1024 characters`);
    }
  }
}

export async function validatePlugin() {
  const errors = [];
  const [pluginSchema, mcpSchema, plugin, mcp] = await Promise.all([
    fetchSchema(PLUGIN_SCHEMA_URL),
    fetchSchema(MCP_SCHEMA_URL),
    readFile(path.join(root, "plugin.json"), "utf8").then(JSON.parse),
    readFile(path.join(root, "mcp.json"), "utf8").then(JSON.parse),
  ]);

  const ajv = new Ajv2020({ allErrors: true, strict: false });
  const validatePluginSchema = ajv.compile(pluginSchema);
  const validateMcpSchema = ajv.compile(mcpSchema);

  if (!validatePluginSchema(plugin)) {
    errors.push(`plugin.json: ${formatErrors(validatePluginSchema)}`);
  }
  if (!validateMcpSchema(mcp)) {
    errors.push(`mcp.json: ${formatErrors(validateMcpSchema)}`);
  }

  if (plugin.$schema !== PLUGIN_SCHEMA_URL) {
    errors.push("plugin.json $schema is not the Agent Plugins 1.0.0 manifest schema");
  }
  if (mcp.$schema !== MCP_SCHEMA_URL) {
    errors.push("mcp.json $schema is not the Agent Plugins 1.0.0 MCP schema");
  }
  if (schemaVersion(plugin.$schema) !== schemaVersion(mcp.$schema)) {
    errors.push("plugin.json and mcp.json target different Agent Plugins versions");
  }
  if (schemaVersion(plugin.$schema) !== SPEC_VERSION) {
    errors.push(`plugin targets ${schemaVersion(plugin.$schema)}, expected ${SPEC_VERSION}`);
  }

  for (const [name, server] of Object.entries(mcp.mcpServers ?? {})) {
    if (server.type === "streamable-http" || server.type === "sse") {
      const problem = validateRemoteUrl(server.url, `mcpServers.${name}.url`);
      if (problem) errors.push(problem);
    }
    if (server.headers) {
      errors.push(
        `mcpServers.${name}.headers is set; Agent Plugins headers are literal package data and must not carry credentials`,
      );
    }
  }

  await validateSkills(errors);
  return errors;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const errors = await validatePlugin();
  if (errors.length > 0) {
    for (const error of errors) console.error(error);
    process.exit(1);
  }
  console.log("plugin.json, mcp.json, and skills/ match Agent Plugins 1.0.0");
}
