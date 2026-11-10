# Agent log

One entry per agent session, newest at the bottom. Be honest: what went wrong is the useful part.

<!-- Copy this block for each session:

## YYYY-MM-DD · <short title>
- Goal:
- Delegated:
- Checkpoints:
- Went wrong:
- Changed by hand:

-->

## 2026-10-06 · Initial MCP tool test
- Goal: Test whether Gemini can connect to my MCP server and choose the correct tool.
- Delegated: Asked Gemini "What does lecture 7 cover?" without specifying which tool to use.
- Checkpoints: Checked `/mcp` first and confirmed that `find_lecture` and `find_topic` were available.
- Went wrong: Nothing significant went wrong. Gemini selected `find_lecture` and returned the correct lecture information.
- Changed by hand: No code was changed during this session.

## 2026-10-06 · Tool description experiment
- Goal: Test whether making the `find_lecture` description less specific changes Gemini's tool choice.
- Delegated: Asked Gemini the same question, "What does lecture 7 cover?"
- Checkpoints: Changed only the description of `find_lecture` before starting the new Gemini session.
- Went wrong: Nothing failed, but the description change did not affect the tool choice. Gemini still selected `find_lecture`.
- Changed by hand: Changed the `find_lecture` description to "Find information about a lecture."

## 2026-11-10 · Study Groups Slice 1
- Goal: Build the first working version of the Study Groups web app.
- Delegated: Asked Gemini to create registration, login and the study groups list using Express and SQLite.
- Checkpoints: Ran npm test (7/7 passed), npm run coverage (88.40% overall, 100% services) and checked the web app in the browser.
- Went wrong: Gemini was initially stuck on Thinking, so I changed to a faster model. No test failures were found in Slice 1.
- Changed by hand: Updated SPEC.md, AGENTS.md and USAGE.md.