# Contributing

ws-chat is a personal learning project. It is built to be *written*, not just to work —
so pull requests that hand over a finished feature are less useful here than an issue
that explains what is broken and why. Bug reports, questions, and small fixes are very
welcome. Large unsolicited rewrites will usually be declined, and that is not about
their quality.

If you want to build on it, fork it. It is MIT licensed.

## Setup

See [README.md](README.md). You need Postgres, a `.env` with `DATABASE_URL`, and a Node
version new enough to run TypeScript without a build step.

## Before you open a PR

```
cd frontend && npm run lint
```

There is no test suite yet. Run both halves and exercise the path you changed — the CLI
client (`npm run client`) exists so you can be a second user without opening a second
browser profile.

## Branches and commits

Branch names are `type/short-description`:

```
feat/session-token
fix/superseded-socket-guard
docs/readme
```

Commits use [Conventional Commits](https://www.conventionalcommits.org/) — `feat:`,
`fix:`, `docs:`, `refactor:`, `chore:` — matching the existing history.

Keep branches short-lived. A branch that lives for weeks conflicts with everything else
touching the same files, and `server/messageHandler.js` is a file everything touches.
Prefer several small merges over one large one.

## Two invariants that are easy to break

These are the rules that are not visible from any single file. Breaking either produces
a bug that looks like something else.

### 1. A message type lives in three places

`shared/` is imported by **both** the server and the frontend. Adding a message type
means all three of:

1. `shared/messageTypes.js` — add it to the `TYPES` enum.
2. `server/messageHandler.js` — add a `case` to the switch.
3. `frontend/src/components/messageHandler.js` — add the matching `case`.

Miss step 3 and the server sends something real that the client silently ignores. Miss
step 1 and the server's `Object.values(Message.TYPES).includes(msgType)` guard rejects
the message before the switch ever sees it.

### 2. `clients` is keyed by user id, and two sockets can hold one id

During a username takeover, the old socket and the new socket have the *same*
`client.id` until the old one finishes closing. So authorization guards must check
**identity**, not existence:

```js
clients.get(client.id) === client   // correct
clients.has(client.id)              // wrong - matches the socket that replaced you
```

The existence check leaves a superseded socket authorized for the window between
`close()` being called and the close event firing. It is a small window and it is real.

## Style

Match the file you are in. The codebase is plain JavaScript on the server (no build
step), TypeScript in `db/`, and JSX with Tailwind utility classes on the frontend.
There is no formatter config — do not reformat files you are not otherwise changing.
