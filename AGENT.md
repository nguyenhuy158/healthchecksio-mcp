# AGENT.md

## Release process

Repo dùng pnpm, không dùng npm cho dev.

Version repo (`package.json`) phải khớp git tag + GitHub release.

Bump version:

1. Sửa `version` trong `package.json` → `X.Y.Z`
2. Commit thay đổi
3. Tag + push:
   ```bash
   git tag -a vX.Y.Z -m "vX.Y.Z"
   git push origin vX.Y.Z
   ```
4. Tạo GitHub release:
   ```bash
   gh release create vX.Y.Z --generate-notes
   ```

Check latest release hiện có:

```bash
gh release list -R nguyenhuy158/healthchecksio-mcp
```
