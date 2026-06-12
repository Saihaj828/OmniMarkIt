# Skills

Skills are reusable slash commands that trigger multi-step workflows in Claude Code.

## Structure

Each skill lives in its own folder:

```
.claude/skills/
  skill-name/
    SKILL.md          ← required — the workflow Claude executes
    context.md        ← optional — reference docs the skill needs
```

## Invoking a skill

Type `/skill-name` in the Claude Code prompt. Claude reads `SKILL.md` and follows the steps.

## Creating a new skill

1. Create `.claude/skills/<your-skill-name>/SKILL.md`
2. Follow the format in `example-skill/SKILL.md`
3. Invoke with `/<your-skill-name>`

## OmniMarkIt skill ideas

- `/tutor-review` — run security-auditor + code-reviewer on a new tutor vetting endpoint
- `/migration-check` — verify Alembic migration is safe before applying to prod
- `/session-flow` — test a full student→tutor session booking flow with Playwright
