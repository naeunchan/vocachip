# Issue Worker Scripts

`scripts/automation/issue_worker.sh` looks for issue-specific implementation scripts in this order:

1. `ISSUE_SCRIPT_PATH` env override
2. `scripts/automation/issues/<ISSUE_IDENTIFIER>.sh`
3. `scripts/automation/issues/<issue_identifier_lowercase>.sh`
4. `scripts/automation/issues/default.sh`
5. `IMPLEMENT_FALLBACK_COMMAND` env command

## Quick start

Create an issue worker script:

```bash
cat > scripts/automation/issues/VOC-999.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

# Example implementation commands
npm run lint -- --max-warnings=0
# apply your code changes here
EOF

chmod +x scripts/automation/issues/VOC-999.sh
```

Then set:

```bash
IMPLEMENT_COMMAND="scripts/automation/issue_worker.sh"
```
