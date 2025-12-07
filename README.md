<img src="https://www.autoreleasenote.com/logo-light.svg" alt="ARN" width="200"/>

[![GitHub Marketplace](https://img.shields.io/badge/Marketplace-Auto%20Release%20Notes-blue.svg?style=flat-square)](https://github.com/marketplace/actions/auto-release-note)
[![Version](https://img.shields.io/github/v/release/papyrus-digital/auto-release-note-action?style=flat-square)](https://github.com/papyrus-digital/auto-release-note-action/releases)

**Stop writing release notes manually.** Auto Release Notes turns your git history into clean, professional release notes using AI and publishes a hosted URL you can share instantly.

This Action wraps the [Auto Release Note CLI](https://www.autoreleasenote.com) so you can drop it into any workflow (tags, branches, PRs, scheduled jobs, etc.) in just a few lines.

## ✨ Features
- **AI-powered summaries:** Convert verbose commits into stakeholder-friendly updates.
- **Hosted URLs:** Every run returns a link you can paste into releases, PRs, Slack, or email.
- **Flexible modes:** Use tags, commit SHAs, or branches depending on your release strategy.
- **Version pinning:** Freeze the CLI version for reproducible builds or stay on `latest`.
- **Marketplace ready:** Documented inputs/outputs, compiled action, and sample workflows.

---

## 🛠 Prerequisites

To use this action you need an API Key and Project ID.

1. **Create an account** at [AutoReleaseNote.com](https://www.autoreleasenote.com/auth/sign-up).
2. Create a project from the dashboard ([autoreleasenote.com/dashboard](https://www.autoreleasenote.com/dashboard)) to obtain your **API Key** and **Project ID**.
3. In GitHub go to **Settings → Secrets and variables → Actions** and add:
   - `ARN_API_KEY`
   - `ARN_PROJECT_ID`

### Where to find your key and project ID

1. Sign in to the Auto Release Note dashboard and open the **API Keys** page at [autoreleasenote.com/settings/key](https://www.autoreleasenote.com/settings/key).
2. Generate or copy the API key that corresponds to the project you plan to automate.
3. Each project card shows its Project ID copy that from url.
4. Store both strings as GitHub Action secrets (`ARN_API_KEY`, `ARN_PROJECT_ID`) so the workflow can authenticate securely.

### Picking a template

Browse all first-party templates (Standard Changelog, Executive Summary, Marketing Launch, etc.) at [autoreleasenote.com/templates](https://www.autoreleasenote.com/templates) to find the tone that matches your stakeholders. Use the exact template name (or custom template ID) in the action’s `template` input—the CLI validates it on execution, so swapping formats is as simple as editing that field.

---

## ⚡ Quick Start

Use the workflow below to generate notes whenever you push a version tag.

```yaml
name: Generate Release Notes

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0 # Required so the CLI can see prior tags/commits

      - name: Determine release range
        id: range
        run: |
          PREV_TAG=$(git describe --tags --abbrev=0 HEAD^ 2>/dev/null || echo "")
          echo "from=$PREV_TAG" >> "$GITHUB_OUTPUT"
          echo "to=${GITHUB_REF_NAME}" >> "$GITHUB_OUTPUT"

      - name: Auto Release Notes
        id: arn
        uses: papyrus-digital/auto-release-note-action@v1
        with:
          api_key: ${{ secrets.ARN_API_KEY }}
          project_id: ${{ secrets.ARN_PROJECT_ID }}
          mode: tag
          from_ref: ${{ steps.range.outputs.from }}
          to_ref: ${{ steps.range.outputs.to }}
          template: 'Standard Changelog'

      - name: Use the output
        run: echo "Release Notes are live at: ${{ steps.arn.outputs.release_url }}"
```

If `from_ref` is empty the CLI falls back to the entire history in the selected mode. `to_ref` defaults to `GITHUB_REF_NAME` when omitted.

---

## 📥 Inputs

| Name | Required | Default | Description |
| --- | --- | --- | --- |
| `api_key` | ✅ | – | Auto Release Note API key. Store it in `ARN_API_KEY`. |
| `project_id` | ✅ | – | Project identifier from AutoReleaseNote.com. |
| `mode` |  | `tag` | Which CLI mode to run (`tag`, `branch`, `commit`, etc.). |
| `from_ref` |  | – | Starting tag/branch/commit. Passed to the CLI via `--from`. |
| `to_ref` |  | Current `GITHUB_REF_NAME` | Ending tag/branch/commit. Passed via `--to`. |
| `template` |  | `Standard Changelog` | Template name or ID configured in Auto Release Note. |
| `output_url` |  | `true` | When `true` the CLI returns a hosted URL instead of raw markdown. |
| `cli_version` |  | `latest` | CLI release tag to download (e.g. `v1.2.3`). Pin it for reproducible builds. |

## 📤 Outputs

| Name | Description |
| --- | --- |
| `release_url` | Hosted URL (or CLI output) returned by Auto Release Note. |

---

## 🎛 Modes & ref combinations

The action exposes every CLI mode plus optional range arguments so you can tailor the window of commits/tags/branches that get summarized.

| Mode | Minimum refs you must supply | Optional combinations | Typical use |
| --- | --- | --- | --- |
| `tag` | `to_ref` (defaults to the pushed tag via `GITHUB_REF_NAME`) | Add `from_ref` to compare two tags. Leave it blank to summarize everything up to the current tag. | Release pipelines that tag builds (`v1.2.3`). |
| `commit` | Both `from_ref` and `to_ref` (SHAs, tags, or branches) | You can feed PR base/head commits, weekly date ranges, or any two SHAs. | PR merges, weekly digests, hotfix windows. |
| `branch` | `to_ref` (branch name). Defaults to `GITHUB_REF_NAME` on branch pushes or workflow inputs. | Combine with `from_ref` only if you want to bound the history (e.g., last known deploy SHA). | Release branches, long-lived feature branches. |

Because `from_ref` and `to_ref` are plain strings, you can mix and match tags (`v1.0.0`), annotated SHAs, or branch names in any mode that supports them, enabling every combination the CLI offers without editing the action code.

---

## 📚 Recipes & Examples

Each workflow below lives in [`recipes/`](./recipes) so you can copy it as-is or mix pieces together.

- [`release-notes-simple.yml`](./recipes/release-notes-simple.yml) – tag-triggered releases with automatic previous-tag detection.
- [`release-notes-tag-trigger.yml`](./recipes/release-notes-tag-trigger.yml) – generate notes whenever `v*` tags are pushed and publish drafts.
- [`release-notes-pr.yml`](./recipes/release-notes-pr.yml) – comment with notes when a PR merges (uses commit SHAs).
- [`release-notes-branch-based.yml`](./recipes/release-notes-branch-based.yml) – manually provide a branch or use the trigger branch.
- [`release-notes-manual.yml`](./recipes/release-notes-manual.yml) – workflow_dispatch with user-entered refs and templates.
- [`release-notes-scheduled.yml`](./recipes/release-notes-scheduled.yml) – weekly digest that also drafts a GitHub release.

### Pull request merges

```yaml
on:
  pull_request:
    types: [closed]
    branches: [main]

jobs:
  pr-notes:
    if: github.event.pull_request.merged == true
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
          ref: ${{ github.event.pull_request.merge_commit_sha }}

      - uses: papyrus-digital/auto-release-note-action@v1
        id: arn
        with:
          api_key: ${{ secrets.ARN_API_KEY }}
          project_id: ${{ secrets.ARN_PROJECT_ID }}
          mode: commit
          from_ref: ${{ github.event.pull_request.base.sha }}
          to_ref: ${{ github.event.pull_request.head.sha }}

      - name: Comment on PR
        uses: actions/github-script@v7
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          script: |
            github.rest.issues.createComment({
              ...context.repo,
              issue_number: context.issue.number,
              body: `📝 Release notes: ${'${{ steps.arn.outputs.release_url }}'}`
            })
```

### Branch-based releases

```yaml
on:
  workflow_dispatch:
    inputs:
      branch:
        description: 'Branch to document'
        required: true

jobs:
  branch-notes:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: papyrus-digital/auto-release-note-action@v1
        id: arn
        with:
          api_key: ${{ secrets.ARN_API_KEY }}
          project_id: ${{ secrets.ARN_PROJECT_ID }}
          mode: branch
          to_ref: ${{ inputs.branch }}
          template: Release Summary

      - run: echo "View release notes at: ${{ steps.arn.outputs.release_url }}"
```

### Scheduled digest

```yaml
on:
  schedule:
    - cron: '0 9 * * 1' # Mondays at 09:00 UTC

jobs:
  weekly-digest:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Gather commit range
        id: range
        run: |
          FROM=$(git log -1 --format="%H" --since="7 days ago")
          TO=$(git rev-parse HEAD)
          echo "from=$FROM" >> "$GITHUB_OUTPUT"
          echo "to=$TO" >> "$GITHUB_OUTPUT"

      - uses: papyrus-digital/auto-release-note-action@v1
        id: arn
        with:
          api_key: ${{ secrets.ARN_API_KEY }}
          project_id: ${{ secrets.ARN_PROJECT_ID }}
          mode: commit
          from_ref: ${{ steps.range.outputs.from }}
          to_ref: ${{ steps.range.outputs.to }}
```

---

## 🔧 Pinning the CLI Version

Set `cli_version` when you need deterministic builds (for example `cli_version: v1.3.0`). Leave it on `latest` to automatically pick up improvements from the distribution repository.
