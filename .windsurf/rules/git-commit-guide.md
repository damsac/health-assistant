# Git Commit Guidelines

## Commit Timing
- DO NOT commit after every individual code change
- Only create commits when a logical unit of work is complete
- A "logical unit" means:
  - A feature is fully implemented and working
  - A bug fix is complete and tested
  - A refactor of a specific component/module is done
  - A prompt/task from the user has been fully addressed

## Commit Message Format
Use this structure for commit messages:
```
<type>: <concise summary of what was requested>

Why: <explanation of why this change was needed>
What: <brief description of the implementation approach>
```

### Types:
- feat: New feature implementation
- fix: Bug fix
- refactor: Code restructuring without behavior change
- chore: Maintenance tasks (dependencies, config, etc.)
- docs: Documentation changes
- style: UI/styling changes

### Examples:
```
feat: Add progressive profile completion to home screen

Why: Users needed a way to add more health context after onboarding without being overwhelmed initially
What: Added completion percentage card with expandable sections for sleep, diet, exercise, etc. Each section navigates to dedicated form and updates completion tracking
```
```
refactor: Simplify onboarding to essential fields only

Why: Original onboarding was too long and causing user drop-off
What: Reduced to 4 screens covering basics (demographics, goals, diet, main challenge). Moved detailed health questions to progressive profile on home screen
```
```
feat: Create dedicated screens for profile sections

Why: Users need quick ways to add sleep, eating, supplement, and lifestyle data
What: Built 5 form screens (sleep, eating, supplements, lifestyle, garmin) with validation, skip options, and automatic completion percentage updates
```

## Before Committing
Ask yourself:
1. Is this task/request fully complete?
2. Does the code work as intended?
3. Would someone reviewing this commit understand what problem was being solved?

## Avoid
- Committing incomplete work
- Messages like "update file.tsx" or "fix bug"
- Committing every file save
- Technical jargon without context in the "Why" section---
trigger: manual
---

