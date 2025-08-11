# 💬 Discuss

Facilitate a structured project decision-making discussion for technical or design decisions.

## Process:

1. **Ask for topic details:**
   "What topic or problem would you like to discuss? Please describe:
   - The issue/challenge we need to solve
   - Any context or constraints
   - The urgency/impact level"

2. **Conduct structured discussion:**
   - Clarify the problem with follow-up questions
   - Research relevant options using available tools
   - Evaluate alternatives with pros/cons
   - Guide toward decision based on project context

3. **Create documentation:**
   - Memory document: `docs/memories/YYY-MM/YYYY-MM-DD-topic-summary.md`
   - How-to guide: `docs/dev/topic-implementation.md` (if implementation steps needed, and is reusable i.e not specific to this topic)

## Memory Document Format:

```markdown
# [icon] [Topic Title]

[Date]

## Problem Statement

[Clear description of the issue]

## Context & Constraints

- [Project context]
- [Technical/business constraints]
- [Timeline requirements]

## Options Evaluated

### Option 1: [Name]

**Pros:** [advantages]
**Cons:** [disadvantages]
**Implementation Effort:** [High/Medium/Low]

## Final Decision

**Chosen Solution:** [selected option]
**Reasoning:** [key factors]

## Next Steps

1. [immediate actions]
   **Timeline:** [when]
   **Owner:** [who]
```

## How-To Document Format (when implementation needed):

```markdown
# [icon] [Topic]

## Overview

[Brief description]

## Prerequisites

- [Required setup/dependencies]

## Step-by-Step Implementation

### Step 1: [Action]

[Instructions/code]

## Best Practices

- [Recommendations]

## Troubleshooting

**Common Issue:** [Solution]
```

## Guidelines:

- Ask clarifying questions before jumping to solutions
- Research thoroughly using available tools
- Present balanced view of all viable options
- Consider existing project context and constraints
- Create both documents unless no implementation guide needed
- Use date prefixes for memory files: YYYY-MM-DD-topic-summary.md
