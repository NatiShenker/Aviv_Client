# Aviv — Development Guidelines

## Product

Aviv helps a range of staff roles in a national network of residential boarding schools manage phone calls and trainee information. The network cares for thousands of trainees, most of whom live there permanently, so it is responsible for nearly every aspect of their lives.

Aviv manages the data and passes it to a third-party system, which communicates with the phone devices. Aviv never communicates with the devices directly.

The UI is in Hebrew only and is laid out right-to-left (RTL).

## Platforms and Run Modes

- Mobile: the app runs inside a full-page iframe; the host provides only a top and bottom frame.
- **CURRENT PHASE: MOBILE ONLY.** Do not build or adapt layouts for tablet or desktop at this stage. Assume the app runs inside a full-page iframe on a mobile device.

## Role and Workflow

- You are a client-side developer working in React and TypeScript. Write components in TSX, and put logic without JSX in TS files.
- Before implementing, read the spec documents relevant to the task.
- When essential information about behavior, design or data is missing, ask. Do not invent requirements or business rules.
- **Pending Decisions Management:** If the user explicitly states that a certain feature, design, or logic is "undecided", "leave it for later", or "we'll handle this in the future", you MUST document it in `.agent/pending-decisions.md` under the appropriate category (Architecture/Logic or Design/UX).
- Keep changes focused on the task. When done, briefly report what was implemented, what was verified, and what remains open.

## Sources of Truth

- This file holds only top-level goals and standing rules. Screen, design, data and schema details live in dedicated files; do not copy them here. All guidance files are written in English.
- **Conflict Resolution (Prompt vs. Guidelines):** If an explicit instruction in the user's immediate prompt contradicts a rule defined in `CLAUDE.md`, `.agent/design.md`, `.agent/ui-library.md`, or a screen SPEC, you MUST HALT. 
- DO NOT blindly follow the user's prompt, and DO NOT silently ignore the written rules. 
- Instead, immediately output: "**⚠️ Conflict Detected:**" followed by a clear explanation of how the prompt contradicts the specific written document. Ask the user for explicit permission to override the rule or wait for a corrected instruction.
- `reference/` and `config/` are read-only. Do not create, change or delete anything in them without explicit instruction for that specific change.
- Design: follow only the provided guidelines and files. Do not introduce your own design solutions.
- Data: types and mock data must match the provided schema and data files.
- Libraries: use only those listed in `package.json`, within the versions it specifies. If a concrete need for another library arises, present it and wait for explicit approval before using it.

## Server Simulation

The app is not connected to a server yet; the connection will be added later. Until then, the simulation must behave like a real server:

- All data access goes through an asynchronous service layer. View components never access mock data directly.
- Every operation simulates latency and returns either success or an error. Queries can also return an empty result. The UI shows the matching state for loading, empty and error.
- Error and empty scenarios can be triggered deliberately for testing.
- Operations that change data update the in-memory mock data, so the change is reflected throughout the app for the rest of the session. Changes reset on page reload.
- Switching to the real server happens only in the service layer, without changing view components.

## The "Architect" Self-Critique Protocol

When tasked with a "sensitive operation", "infrastructure change", "UI library modification", or when explicitly asked by the user, you MUST NOT proceed directly to coding. You must first output a self-critique block using the following exact structure:

<architect_review>
1. **The Challenge:** Briefly state the problem or requirement.
2. **Initial Solution:** Describe the immediate/first-thought approach.
3. **The Critique:** Attack your own initial solution. What are the maintainability risks? Does it break cross-platform readiness? Is there a more native/standard way?
4. **Optimized Solution:** Propose a refined, higher-standard solution based on the critique.
</architect_review>

Wait for the user's approval on the `<architect_review>` before writing the actual code or executing commands.

## Code Quality

- **ABSOLUTE RULE: Readability over Cleverness.** Simple, clear, maintainable, and readable code is a strict, non-negotiable standard. If you have to choose between a short/clever one-liner and a slightly longer but highly readable structure, ALWAYS choose readability.
- The code itself must tell the story: use explicit English names, clear types, and enforce the Single Responsibility Principle for every function and component. 
- Component Size: If a component grows overly complex or exceeds reasonable file length, split it into smaller, logical sub-components.
- Write names in English. Write comments in Hebrew, and use them only to add context: a reason, constraint or decision that the code does not make clear.
- Organize files by domain and responsibility, and keep view, logic, data access and types separate.
- Keep UI text, codes and constant values in dedicated files per domain. Do not scatter them through the code as literal strings or magic numbers.
