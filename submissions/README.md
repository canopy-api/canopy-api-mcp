# Submitting to marketplaces

These steps are for maintainers publishing a release. Nothing in this repo submits a listing on its own.

Before any submission, bump `version` in every manifest (`package.json`, `server.json`, `plugin.json`, `.claude-plugin/plugin.json`, `.cursor-plugin/plugin.json`, `.grok-plugin/plugin.json`) and run `npm run validate:plugin`, which fails if they disagree.

**Cursor — form, signed in.** Marketplace plugins must be open source and are reviewed manually.

1. Merge this change to the public default branch.
2. Sign in at [cursor.com/marketplace/publish](https://cursor.com/marketplace/publish).
3. Submit the repository URL `https://github.com/canopy-api/canopy-api-mcp`.
4. Wait for Cursor's review. Updates to the default branch are reviewed again.

**Claude Code — no form for this repo's marketplace.** Anyone can install from the git catalog in the main README as soon as the commit is on GitHub. Pushing a new commit is the release. If `version` in `.claude-plugin/plugin.json` does not change, `claude plugin update` keeps the previous copy, so bump `version` on each release.

**Anthropic directory — form, signed in to claude.ai.** Submitting needs a paid plan (Pro, Max, Ultra, Team, or Enterprise). On Team and Enterprise, an Owner submits, or an Enterprise Owner grants the Directory permission.

1. Merge to the public default branch. Connect the GitHub account that can push to `canopy-api/canopy-api-mcp` on [claude.ai](https://claude.ai).
2. Open [claude.ai/directory/manage](https://claude.ai/directory/manage), choose **Submit new**, then **Plugin bundle**.
3. Repository: `canopy-api/canopy-api-mcp`. Leave the plugin path empty (the manifest is at the repo root). Leave the branch empty to track the default branch.
4. Select **Validate**, fix anything that blocks submission, and validate again. The repo-root `package-lock.json` is expected to be held for a reviewer (`Dependencies install from a lockfile`) because the plugin folder is the repository root. That hold is not a rejection.
5. Finish listing details, data handling, and compliance, then **Submit for review**.
6. The Canopy MCP server is already listed at [claude.ai/directory/canopy](https://claude.ai/directory/canopy). Do not create a second connector. From the same organization, pair this plugin with that connector so both point at `https://mcp.canopyapi.co/mcp`.
7. When the version passes, select **Publish**. With the GitHub push webhook (admin on the repo), later commits on the tracked branch are scanned without a new form.

**xAI — pull request, no form.** Do not open the PR until the plugin commit is on the public default branch. `submissions/xai-marketplace-entry.json` is the object to append to `.grok-plugin/marketplace.json` in [xai-org/plugin-marketplace](https://github.com/xai-org/plugin-marketplace). Its `sha` is shipped as the placeholder `REPLACE_WITH_40_CHAR_MAIN_SHA`, so xAI's validator rejects the entry until it is set to the full commit you want Grok to install.

1. After the release commit is on `main`, set the pin:

   ```bash
   git ls-remote https://github.com/canopy-api/canopy-api-mcp.git refs/heads/main
   ```

   Put that 40-character SHA in `source.sha` (leave the file in this repo on the placeholder). A squash merge does not keep the SHA from the pull request branch.
2. Fork `xai-org/plugin-marketplace` and branch from `main`.
3. Append the entry to `.grok-plugin/marketplace.json`. Do not vendor the plugin under `external_plugins/`.
4. From that fork, regenerate and validate (CI runs the same commands):

   ```bash
   python3 scripts/generate-plugin-index.py
   python3 scripts/validate-catalog.py
   python3 scripts/generate-plugin-index.py --check
   ```

5. Open a pull request with the repo's template. Remote third-party plugins are reviewed by the code owners. To ship a later update, bump `sha` and regenerate the index. Do not add a second `canopy` entry.

**Note on `grok plugin validate`.** In this repo it reports the Agent Plugins manifest at root `plugin.json` (name `canopy-api-mcp`) because the CLI checks that file before `.grok-plugin/plugin.json`. The xAI catalog indexer reads `.grok-plugin/plugin.json`, and the marketplace install id is `canopy`.
