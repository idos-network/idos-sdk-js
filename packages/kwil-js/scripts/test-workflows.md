# Local Workflow Testing with `gh act`

## Setup (one-time)

1. **Install Act via GitHub CLI extension**  
   ```bash
   gh extension install nektos/gh-act  # one-time
   gh act --version
   ```
   Docs: [Intro](https://nektosact.com/introduction.html) • [Install](https://nektosact.com/installation/index.html)

2. **Docker** must be running (`docker info`).

3. **Provide a GitHub token** so actions such as `checkout` can clone:  
   ```bash
   echo "GITHUB_TOKEN=$(gh auth token)" >> .secrets.act        # or use -s GITHUB_TOKEN=$(gh auth token)
   ```

---

## Quick-run commands

### Release (latest)
```bash
gh act workflow_dispatch -W .github/workflows/release.yml \
  --secret-file .secrets.act \
  --eventpath .act-events/release-latest.json \
  --env ACT=true
```

### Beta release
```bash
gh act workflow_dispatch -W .github/workflows/release.yml \
  --secret-file .secrets.act \
  --eventpath .act-events/release-beta.json \
  --env ACT=true
```

### Preview build (PR)
```bash
gh act workflow_dispatch -W .github/workflows/preview-build.yml \
  --secret-file .secrets.act \
  --eventpath .act-events/preview-pr.json \
  --env ACT=true   # PR state check may fail locally
```

### CI
```bash
gh act pull_request -W .github/workflows/ci.yaml \
  --secret-file .secrets.act
```

---

## Notes

* Workflows respect `ACT=true` to avoid real publishing, pushes, and comments.