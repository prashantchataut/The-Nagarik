# Pending workflows

The Arena sandbox's GitHub App token has no `workflows` permission, so it
cannot push files under `.github/workflows/`. To activate CI, run once from
any machine with normal push rights (or use the GitHub web UI "Add file"):

```bash
git mv .github/workflows-pending/ci.yml .github/workflows/ci.yml
git commit -m "ci: activate workflow"
git push
```

The workflow itself is complete and self-contained (see docs/adr/0006).
