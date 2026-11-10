#  Study Groups - Student Collaboration Platform

<!-- Exercise 2. Write the non-goals first. Every acceptance criterion must be checkable in under a minute.
     Keep these headings exactly as they are: the self-checks look for them by name.
     The full target is on the course site under Resources → The course project. -->

## Project option
Study groups
<!-- One line: lab booking, study groups, club events, or the own project the lecturer approved. -->

## Goals
- Allow students to create accounts and sign in securely.
- Allow students to create study groups for different subjects.
- Allow students to browse and join existing study groups.
- Allow group creators to manage their study groups.
- Help students find suitable study groups using AI recommendations.

## Non-goals
- Real-time chat or video calls between students.
- Online payments or paid study group memberships.
- Mobile applications for Android or iOS.
- Automatic scheduling based on students' calendars.

## Constraints
- Node.js with Express, SQLite, plain HTML and JavaScript.
- Passwords are stored as hashes, never as plain text.
- Only signed-in students can create or join groups.

## The model feature
<!-- Which model, which modality, and what it does for a user.
     Name three things or the check fails: the input it receives, the output it produces,
     and what happens when the model is slow, rate-limited or wrong. -->
- Model: Gemini, text-based AI.
- Input: A subject entered by the student.
- Output: Recommended study groups with short explanations.
- When it fails: Show an error message and let the student browse groups manually.

## Auth
<!-- Local sign-in plus at least one provider. Say how an account signing in both ways stays one account. -->
- Local: Students sign in with email and password. Passwords are hashed.
- Provider: Students can sign in with Google.
- Linking: Both methods use the same account when the email is verified.

## MCP tools
<!-- At least three tools your own MCP server exposes over this project's data.
     Each tool calls the same service functions the HTTP API calls, so the same rules apply.
     A description shorter than 20 characters is not a description. -->
| Tool | What it does | Who may call it |
| list_groups | Lists all available study groups and their subjects. | Everyone |
| create_group | Creates a new study group for a selected subject. | Signed-in students |
| join_group | Adds a signed-in student to an existing study group. | Signed-in students |

## UI
<!-- Stack, and the three or more screens. The graded checklist lives in docs/UI.md. -->
- Stack: HTML, CSS and JavaScript.
- Login screen: Students can sign in or register.
- Groups screen: Students can see and search study groups.
- Create group screen: Students can create a new study group.
- Group details screen: Students can view and join a group.

## Architecture
<!-- Exercise 3. One request traced through every layer, naming the file for each one,
     plus one place where your own code does not match this layering. -->

## Acceptance criteria
<!-- Every criterion carries an id. A test proves it by naming that id in its title, for example
     test('AC-3 a booking that overlaps another is refused with 409', ...).
     Say who acts, what they see, and what must be true in the database. -->
- [AC-1] A student registers with email and password, and the account is saved in the database.
- [AC-2] A student signs in with correct credentials and sees the groups page.
- [AC-3] A student signs in with Google and accesses their account.
- [AC-4] A signed-in student sees all available study groups.
- [AC-5] A student creates a group, and it is saved in the database.
- [AC-6] A student joins a group, and the membership is saved.
- [AC-7] A student leaves a group, and the membership is removed.
- [AC-8] A student searches for a subject and sees matching groups.
- [AC-9] A student requests AI recommendations and sees suggested groups.

### Slice 1: sign-in and <list screen>
- [AC-10] A visitor who opens `/groups` without signing in is redirected to `/login`.
- [AC-11] After signing in, a student sees three study groups loaded from the database.
- [AC-12] Deleting a group from the database and reloading `/groups` removes that group from the screen.

## Traceability
| Criterion | Test |
| --- | --- |
| AC-1 | Registration test in app.test.js |
| AC-2 | Login test in app.test.js |
| AC-10 | Login redirect test in app.test.js |
| AC-11 | Study groups list test in app.test.js |
| AC-12 | Group deletion test in app.test.js |

## Spec vs result
- Passed: Registration, login, redirect to /login, and study groups loaded from the SQLite database.
- Missed: No confirmed failures in the tested Slice 1 acceptance criteria.
- Changed: Added AC-10, AC-11 and AC-12 to make the login redirect and database-backed groups list explicitly testable.
