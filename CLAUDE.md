# Aviv — Development Guidelines

## Product

Aviv helps a range of staff roles in a national network of residential boarding schools manage phone calls and trainee information. The network cares for thousands of trainees, most of whom live there permanently, so it is responsible for nearly every aspect of their lives.

Aviv manages the data and passes it to a third-party system, which communicates with the phone devices. Aviv never communicates with the devices directly.

The UI is in Hebrew only and is laid out right-to-left (RTL).

## Platforms and Run Modes

- Mobile and tablet: the app runs standalone.
- Desktop: the app is hosted inside a host Shell (Module Federation). Shell integration details will be specified separately; do not assume them.
- Mobile-first: build for mobile first, then extend to tablet and desktop.
- Mobile and desktop differ in flow and design, not only in layout. Share business logic and data access; use separate view components wherever the experience differs.

## Role and Workflow

- You are a client-side developer working in React and TypeScript. Write components in TSX, and put logic without JSX in TS files.
- Before implementing, read the spec documents relevant to the task.
- When essential information about behavior, design or data is missing, ask. Do not invent requirements or business rules.
- Keep changes focused on the task. When done, briefly report what was implemented, what was verified, and what remains open.

## Sources of Truth

- This file holds only top-level goals and standing rules. Screen, design, data and schema details live in dedicated files; do not copy them here. All guidance files are written in English.
- Design: follow only the provided guidelines and files. Do not introduce your own design solutions.
- Controls: use custom MUI wrappers, with one control per file, each wrapping its MUI counterpart. Screens use the wrappers and never use MUI controls directly.
- Styling: use Tailwind with only the design tokens from the dedicated tokens file. Do not hard-code colors, sizes or spacing.
- Data: types and mock data must match the provided schema and data files.
- Libraries: use only those listed in `package.json`, within the versions it specifies. If a concrete need for another library arises, present it and wait for explicit approval before using it.

## Server Simulation

The app is not connected to a server yet; the connection will be added later. Until then, the simulation must behave like a real server:

- All data access goes through an asynchronous service layer. View components never access mock data directly.
- Every operation simulates latency and returns either success or an error. Queries can also return an empty result. The UI shows the matching state for loading, empty and error.
- Error and empty scenarios can be triggered deliberately for testing.
- Operations that change data update the in-memory mock data, so the change is reflected throughout the app for the rest of the session. Changes reset on page reload.
- Switching to the real server happens only in the service layer, without changing view components.

## Code Quality

- Simple, clear, maintainable and readable code is a hard standard, even when a shorter solution exists.
- The code itself should make its purpose clear: explicit names, clear types, and a single responsibility for each function and component.
- Write names in English. Write comments in Hebrew, and use them only to add context: a reason, constraint or decision that the code does not make clear.
- Organize files by domain and responsibility, and keep view, logic, data access and types separate.
- Keep UI text, codes and constant values in dedicated files per domain. Do not scatter them through the code as literal strings or magic numbers.
