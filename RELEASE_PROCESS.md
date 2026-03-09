# Release Process

## Steps

### 1. Update version in package.json

```bash
# Edit package.json "version" field to the new version (e.g., 1.3.0)
```

### 2. Commit the version bump

```bash
git add package.json
git commit -m "Bump version to x.y.z"
```

### 3. Publish to npm

```bash
npm publish
```

`prepublishOnly` hook runs `tsc` automatically before publishing. If the build fails, fix the issue before proceeding.

### 4. Push commits

```bash
git push origin main
```

### 5. Create git tags

```bash
git tag vx.y.z
git tag -f v1          # Update major version tag
git push origin vx.y.z
git push origin v1 --force
```

### 6. Create GitHub Release

```bash
gh release create vx.y.z --title "vx.y.z" --notes "Release notes here"
```

## Order

npm publish before git tagging. If the build or publish fails, there's no tag to revert.
