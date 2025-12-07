### Step 1: Commit the Build Artifacts

You must commit the dist/ folder. This is what GitHub Actions will actually run.

```bash
# 1. Add the important files
git add action.yml package.json package-lock.json README.md
git add dist/index.js dist/licenses.txt

# 2. Commit
git commit -m "feat: initial release with compiled action"
```

### Step 2: Tag the Release
To publish to the Marketplace, you must tag your commit.

```bash
# 1. Create the specific version tag
git tag -a v1.0.0 -m "Initial release"

# 2. Create the major version tag (Best Practice)
# Users will use 'uses: papyrus-digital/auto-release-note-action@v1'
git tag -a v1 -m "Major version 1"

# 3. Push everything to GitHub
git push origin master --tags
```

### Step 3: Publish on Github

- Go to your repository on GitHub.
- Click "Draft a release" (sidebar).
- Select the tag v1.0.0.
- Important: Check the box "Publish this Action to the GitHub Marketplace".
- Click "Publish release".
- Your action will be live immediately!