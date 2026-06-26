# Cross-tool instruction files
- AGENTS.md is the canonical shared instruction source for this repo.
- The root **CLAUDE.md** is the Claude Code entrypoint for this repo and imports the root **AGENTS.md**
- Repo-defined definitions live under **.claude/agents**.
- Shared repo skills live under **.claude/skills**

# Global rules
- Suggest changes to the engineer you are working with if you believe the **AGENTS.md** file is missing important information or could be improved
- Try to keep changes scoped to the target module limit external dependencies as much as possible
- Prefer minimal, non-breaking changes
- Never use a python/awk script for something that can be achieved with shell commands
- If you cannot figure out the prompt in two reasoning steps stop and ask for directions
- If you think you are missing important context or a specific reference stop and ask for direction
- Never run any git commands except git status, git log and git diff
- Never use emojis when writing documentation or code comments