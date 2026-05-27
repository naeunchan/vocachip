# Git Branch Skill

## Purpose

This skill guides Codex to safely inspect, create, switch, update, merge, rebase, clean up, and recover Git branches without accidentally losing user work.

Use this skill whenever the task involves:

- Creating a new branch
- Switching branches
- Checking the current branch
- Renaming a branch
- Deleting local or remote branches
- Syncing a branch with `main`, `master`, `develop`, or another base branch
- Preparing a pull request
- Resolving branch divergence
- Handling uncommitted changes before branch operations
- Recovering from a wrong branch, wrong commit, or accidental branch deletion

---

## Core Principles

1. **Never discard user work unless explicitly requested.**
   - Do not run destructive commands such as:
     - `git reset --hard`
     - `git clean -fd`
     - `git branch -D`
     - `git push --force`
     - `git checkout .`
     - `git restore .`
   - Use safer alternatives first.

2. **Always inspect repository state before changing branches.**
   - Run:
     ```bash
     git status --short --branch
     git branch --show-current
     git remote -v
     ```

3. **Prefer modern Git commands.**
   - Prefer:
     ```bash
     git switch <branch>
     git switch -c <new-branch>
     ```
   - Avoid `git checkout` unless compatibility is required.

4. **Never assume the default branch is `main`.**
   - Detect it:
     ```bash
     git remote show origin
     ```
   - Common base branches:
     - `main`
     - `master`
     - `develop`
     - `dev`

5. **Do not mix unrelated changes.**
   - Before creating commits, inspect:
     ```bash
     git diff
     git diff --staged
     git status --short
     ```
   - Only stage files relevant to the task.

6. **Ask before force-pushing.**
   - If force push is required, prefer:
     ```bash
     git push --force-with-lease
     ```
   - Never use plain `git push --force` unless the user explicitly confirms.

---

## Standard Branch Workflow

### 1. Inspect Current State

Before any branch operation:

```bash
git status --short --branch
git branch --show-current
git branch --list
git branch -r
```

Check whether there are uncommitted changes.

If there are uncommitted changes, decide:

- If changes are relevant to the current task, keep them.
- If changes are unrelated, do not overwrite them.
- If switching branches is required, stash them safely.

Safe stash command:

```bash
git stash push -u -m "codex: save work before branch switch"
```

---

### 2. Create a New Branch

Use a descriptive branch name.

Recommended format:

```txt
type/short-description
```

Examples:

```txt
feature/add-login-form
fix/git-branch-skill
refactor/user-profile-hooks
chore/update-dependencies
docs/git-branch-guide
```

Create and switch:

```bash
git switch -c <branch-name>
```

Example:

```bash
git switch -c docs/git-branch-skill
```

---

### 3. Switch to an Existing Branch

First check status:

```bash
git status --short --branch
```

If clean:

```bash
git switch <branch-name>
```

If there are local changes, do not switch blindly.

Options:

```bash
git stash push -u -m "codex: save work before switching to <branch-name>"
git switch <branch-name>
```

After switching, optionally restore stash:

```bash
git stash list
git stash pop
```

If conflicts happen during `stash pop`, stop and report the conflict.

---

### 4. Fetch Remote Branches

Before working with remote branches:

```bash
git fetch --all --prune
```

List remote branches:

```bash
git branch -r
```

Create a local branch tracking a remote branch:

```bash
git switch --track origin/<branch-name>
```

Or:

```bash
git switch <branch-name>
```

If Git can infer the remote branch automatically.

---

## Sync Branch with Base Branch

Use this when the user asks to update a feature branch with the latest `main`, `master`, or `develop`.

### 1. Detect Current Branch

```bash
git branch --show-current
```

### 2. Fetch Latest Remote State

```bash
git fetch origin --prune
```

### 3. Check Base Branch

Examples:

```bash
git branch -r | grep origin/main
git branch -r | grep origin/master
git branch -r | grep origin/develop
```

### 4. Choose Merge or Rebase

Default safe option:

```bash
git merge origin/<base-branch>
```

Cleaner linear history option, only if appropriate:

```bash
git rebase origin/<base-branch>
```

Rules:

- Use `merge` if the branch is shared with other people.
- Use `rebase` only if the branch is personal or the project convention requires it.
- Do not rebase public/shared branches without confirmation.

---

## Merge Workflow

To merge a feature branch into the current branch:

```bash
git status --short --branch
git fetch origin --prune
git merge <source-branch>
```

If conflicts occur:

```bash
git status
```

Then resolve files manually.

After resolving:

```bash
git add <resolved-files>
git commit
```

Do not auto-resolve conflicts by deleting large sections unless the user explicitly asks.

---

## Rebase Workflow

Use only when safe.

```bash
git status --short --branch
git fetch origin --prune
git rebase origin/<base-branch>
```

If conflicts occur:

```bash
git status
```

After resolving each conflict:

```bash
git add <resolved-files>
git rebase --continue
```

Abort rebase if needed:

```bash
git rebase --abort
```

Never continue a rebase without checking the conflict resolution.

---

## Rename Branch

Rename current local branch:

```bash
git branch -m <new-branch-name>
```

Rename another local branch:

```bash
git branch -m <old-branch-name> <new-branch-name>
```

If the branch was already pushed:

```bash
git push origin -u <new-branch-name>
git push origin --delete <old-branch-name>
```

Before deleting the old remote branch, confirm that the new branch exists remotely:

```bash
git branch -r
```

---

## Delete Branch

### Delete Local Branch Safely

Use lowercase `-d` first:

```bash
git branch -d <branch-name>
```

If Git refuses because the branch is not merged, do not force delete unless the user confirms.

Force delete only with explicit confirmation:

```bash
git branch -D <branch-name>
```

### Delete Remote Branch

```bash
git push origin --delete <branch-name>
```

Before deleting, confirm:

```bash
git branch -r
```

---

## Check Branch Differences

Compare current branch with base:

```bash
git fetch origin --prune
git diff origin/<base-branch>...HEAD
```

Show changed files only:

```bash
git diff --name-only origin/<base-branch>...HEAD
```

Show commits on current branch but not base:

```bash
git log --oneline origin/<base-branch>..HEAD
```

Show commits in base but not current branch:

```bash
git log --oneline HEAD..origin/<base-branch>
```

---

## Commit Safely on a Branch

Before committing:

```bash
git status --short
git diff
git diff --staged
```

Stage only relevant files:

```bash
git add <file1> <file2>
```

Avoid:

```bash
git add .
```

unless all changes are verified and relevant.

Commit message format:

```txt
type: short summary
```

Examples:

```txt
docs: add git branch skill
fix: prevent branch switch with dirty state
refactor: simplify branch detection logic
```

Commit:

```bash
git commit -m "docs: add git branch skill"
```

---

## Push Branch

First push:

```bash
git push -u origin <branch-name>
```

Subsequent pushes:

```bash
git push
```

If rejected because remote has new commits:

```bash
git fetch origin
git status --short --branch
```

Then choose:

```bash
git merge origin/<branch-name>
```

or, if safe:

```bash
git rebase origin/<branch-name>
```

Do not force push without confirmation.

---

## Pull Request Preparation

Before telling the user the branch is ready for PR:

```bash
git status --short --branch
git fetch origin --prune
git diff --name-only origin/<base-branch>...HEAD
git log --oneline origin/<base-branch>..HEAD
```

Confirm:

- Working tree is clean.
- Branch is pushed.
- Changes are scoped to the task.
- No secrets or temporary files are included.
- Tests/lint were run if available.

Recommended PR summary:

```md
## Summary

- ...

## Changes

- ...

## Test

- [ ] Not run
- [ ] Ran lint
- [ ] Ran tests
- [ ] Manual verification
```

---

## Handling Uncommitted Changes

If the working tree is dirty, classify changes:

```bash
git status --short
git diff
```

### Relevant Changes

Keep and continue.

### Unrelated Changes

Do not touch them.

Options:

```bash
git stash push -u -m "codex: unrelated changes before branch task"
```

### User Wants to Discard Changes

Only after explicit confirmation:

```bash
git restore <file>
```

For untracked files, confirm before:

```bash
git clean -fd
```

---

## Recovery Commands

### Find Recent Branch/Commit Movements

```bash
git reflog
```

### Recover Deleted Branch

Find commit hash from reflog:

```bash
git reflog
```

Create branch from commit:

```bash
git switch -c <branch-name> <commit-hash>
```

### Undo Last Commit but Keep Changes

```bash
git reset --soft HEAD~1
```

### Undo Last Commit and Unstage Changes

```bash
git reset HEAD~1
```

Do not use `git reset --hard` unless explicitly confirmed.

---

## Branch Naming Rules

Use:

```txt
feature/<description>
fix/<description>
hotfix/<description>
refactor/<description>
docs/<description>
chore/<description>
test/<description>
```

Rules:

- Lowercase only
- Use hyphens
- No spaces
- No Korean branch names unless the repository already uses them
- Keep names short but meaningful

Good:

```txt
feature/word-search-screen
fix/stash-before-branch-switch
docs/git-branch-skill
```

Bad:

```txt
new
test
fix
은찬작업
my branch
```

---

## Safety Checklist Before Running Branch Commands

Before branch operations, Codex must check:

```bash
git status --short --branch
```

If output shows modified, deleted, renamed, or untracked files:

- Do not switch branches blindly.
- Do not delete branches.
- Do not reset.
- Do not clean.
- Either keep changes, stash them, or ask the user.

---

## Commands Reference

### Current Branch

```bash
git branch --show-current
```

### Local Branches

```bash
git branch
```

### Remote Branches

```bash
git branch -r
```

### All Branches

```bash
git branch -a
```

### Create Branch

```bash
git switch -c <branch-name>
```

### Switch Branch

```bash
git switch <branch-name>
```

### Fetch Remote Updates

```bash
git fetch --all --prune
```

### Track Remote Branch

```bash
git switch --track origin/<branch-name>
```

### Merge Base Branch

```bash
git merge origin/<base-branch>
```

### Rebase onto Base Branch

```bash
git rebase origin/<base-branch>
```

### Delete Local Branch

```bash
git branch -d <branch-name>
```

### Delete Remote Branch

```bash
git push origin --delete <branch-name>
```

### Rename Branch

```bash
git branch -m <new-branch-name>
```

### Push New Branch

```bash
git push -u origin <branch-name>
```

---

## Codex Behavior Rules

When asked to perform Git branch work, Codex should:

1. Inspect current state.
2. Identify current branch.
3. Identify base branch.
4. Protect uncommitted changes.
5. Use `git switch` instead of `git checkout`.
6. Avoid destructive commands.
7. Explain what changed.
8. Provide exact commands run or recommended.
9. Stop immediately on conflicts or unexpected Git errors.
10. Ask before force push, hard reset, clean, or force delete.

---

## Example Workflows

### Create Feature Branch from Latest Main

```bash
git status --short --branch
git fetch origin --prune
git switch main
git pull --ff-only origin main
git switch -c feature/my-task
```

If default branch is `master`, replace `main` with `master`.

---

### Save Current Work and Switch Branch

```bash
git status --short --branch
git stash push -u -m "codex: save work before switching branch"
git switch <target-branch>
```

Restore later:

```bash
git stash pop
```

---

### Update Current Branch with Main

```bash
git status --short --branch
git fetch origin --prune
git merge origin/main
```

Or, if safe and preferred:

```bash
git rebase origin/main
```

---

### Prepare Branch for Pull Request

```bash
git status --short --branch
git fetch origin --prune
git diff --name-only origin/main...HEAD
git log --oneline origin/main..HEAD
git push -u origin $(git branch --show-current)
```

---

## Do Not Do These Without Explicit Confirmation

```bash
git reset --hard
git clean -fd
git branch -D <branch>
git push --force
git restore .
git checkout .
git rebase <shared-branch>
```

Use safer alternatives first.

---

## Final Response Format

After completing branch work, respond with:

```md
## 완료

현재 브랜치: `<branch-name>`

작업 내용:
- ...

실행한 주요 명령어:
- `...`

주의사항:
- ...

다음 단계:
- ...
```

If blocked:

```md
## 중단됨

이유:
- ...

현재 상태:
- ...

필요한 사용자 결정:
- ...
```
