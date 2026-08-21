---
id: "docs-as-code-map"
order: 2
title: "The docs/ Folder Is Not a Manual, but a Map of the Code"
date: "2026-07-27"
category: "ENGINEERING / DOCS"
excerpt: "Code keeps the full implementation; docs keep the shape of the system: docs/ is a zoomable map of the project."
featured: false
---

In a lot of projects, the `docs/` folder eventually turns into a strange place.

Inside you might find an architecture diagram from six months ago, an API design that no longer works, a few dev logs you can't quite trust, and a TODO that was never finished.

Each file is somewhat useful on its own. Put together, they can hardly tell you what the project actually looks like now.

So most of the time, we skip the docs and read the code instead.

Code, at least, doesn't lie. Whatever it runs as, that is what the project is.

But as a project grows, especially once an Agent starts modifying a dozen or several dozen files at a time, understanding the whole project through code alone also becomes expensive.

There is too much detail in code.

You only want to know what a module should depend on, yet you have to trace through Imports, types, constructors, and method calls all the way down. You do get the answer in the end, but your head is also filled with implementations you don't need to care about right now.

That's when a good `docs/` folder can serve a different purpose:

> It is not a manual for the code, but a map of the code.

Code keeps the full implementation. Docs keep the shape of the system.

## Code Already Has a Topology

A project is not a pile of unrelated files.

There are Imports between files, calls between modules, interfaces connecting frontend and backend, events connecting producers and consumers, and data flowing from one component to another.

Code is naturally a graph.

Files can be seen as nodes; references, calls, and dependencies are edges.

It's just that this graph is buried under a mass of implementation detail.

For example, a real project might look like this:

```text
HTTP Route
    ↓
Service
    ├──→ Domain
    └──→ Repository
              ↓
           Database
```

You can certainly find these relationships in the code, but they may be scattered across many files.

Docs can map those relationships back out, keeping only the parts you need to care about right now.

It doesn't need to explain how every function is implemented, nor update in sync with every variable rename. It only needs to state things that are more stable:

* which module is responsible for what;
* which module depends on which;
* who owns the data;
* where state is produced;
* which layer may access the database;
* which boundaries must not be crossed;
* which piece of content is the source of truth;
* which features are done;
* which are only reserved interfaces.

Code is a map that contains every detail.

Docs are a map you can zoom.

## Documentation Files Form a Topology Too

A documentation system doesn't have to be just a directory tree.

Every Markdown file can be treated as a node.

File paths are the indexes of the nodes; links and references inside the docs are the edges between them.

For example:

```text
docs/
├── README.md
├── architecture/
│   ├── overview.md
│   ├── combat.md
│   └── memory.md
├── design/
│   ├── game-loop.md
│   └── skill-system.md
├── decisions/
│   ├── 001-server-authoritative.md
│   └── 002-memory-boundary.md
└── tasks/
    ├── active/
    └── completed/
```

Viewed by directory, it is a tree.

`architecture/`, `design/`, `decisions/`, and `tasks/` are different branches; files are assigned to different paths by purpose.

But the directory tree is only one view of this documentation topology.

For example, `architecture/combat.md` might reference:

```text
architecture/overview.md
design/skill-system.md
decisions/001-server-authoritative.md
tasks/active/combat-playback.md
```

And so these files form a directed graph of their own:

```text
README.md
    ↓
architecture/overview.md
    ↓
architecture/combat.md
    ├──→ design/skill-system.md
    ├──→ decisions/001-server-authoritative.md
    └──→ tasks/active/combat-playback.md
```

This directed graph still refers to **the topology between documentation files**.

When one file points to another, it means:

* before reading this doc, you should understand another one first;
* the current architecture depends on a certain design;
* an implementation follows a past decision;
* a task needs to modify or verify a module;
* a new doc replaces an old one;
* a phase report corresponds to a specific round of development.

The same set of files can be viewed as a list, a directory tree, and a directed graph at the same time.

Lists are good for expressing order:

```text
1. What is currently in progress
2. What comes next
3. What is waiting for confirmation
4. What is explicitly not being done
```

Directory trees are good for expressing classification and ownership:

```text
architecture/
design/
reference/
workflow/
```

Directed graphs are good for expressing cross-directory relationships.

A file can only live at one path on disk, but it can connect with many other files.

So a file path is not just a storage location.

It is also a stable index.

And Markdown links are the edges in the documentation topology.

## Docs Are a Mirror, but They Shouldn't Parrot the Code

Calling docs a mirror of the code easily leads to a misunderstanding:

Does everything in the code have to be written again in the docs?

Of course not.

If the code has a `CombatService.startBattle()`, and the doc then says:

> There is a `startBattle` method in `CombatService`, used to start a battle.

This kind of documentation is almost meaningless.

The moment the function is renamed, it goes stale. Even without a rename, it tells you no more than searching the code directly.

A good documentation mirror does not map every pixel of the code.

It maps the outline.

For example, the code may contain dozens of combat-related classes, but the doc only needs to keep:

```text
Battle entry
    ↓
Pre-battle snapshot
    ↓
Pure-function simulation
    ↓
Mode-specific settlement
    ↓
Persist the results
    ↓
Frontend plays back the action sequence
```

This diagram doesn't care what a method is called, yet it can state:

* combat results are produced by the server;
* the frontend only plays them back;
* the simulation should not read the database directly;
* differences between combat modes belong in the settlement phase;
* once combat starts, an immutable snapshot is used.

These rules are far more stable than any specific function name.

The implementation can split from one class into five, or change from sync to async. As long as module responsibilities stay the same, the doc topology doesn't need a full rewrite.

Conversely, if responsibilities change, the docs should be updated even if the code still runs.

## Once You Stop Reading All the Code, You Need Docs Even More

Before Agents, developers maintained their understanding of a project by writing and reading code themselves.

Now an Agent can search the repo, modify files, run tests, analyze errors, and keep fixing on its own.

One task can produce a large amount of code, and the developer no longer confirms every line of it.

This is not necessarily a bad thing.

Much of the syntax, boilerplate, data conversion, and test filling was never worth the same amount of human attention.

But once we stop following every code detail, we have to grasp the project one level up.

At minimum, you need to know:

* what modules the project currently has;
* how the modules connect;
* which module owns a given piece of state;
* which nodes a change affects;
* which boundary is being breached;
* what is not truly finished yet;
* how the current implementation is meant to expand later.

`docs/` exists to hold this layer of understanding.

It lets you know how the system is composed without memorizing every file.

You don't need to remember exactly how Tokens are counted inside the rate limiter. You only need to know:

```text
Live connections
├── Handshake rate limiting
├── Per-account connection limits
├── Command cost limits
└── Reconnecting doesn't reset quotas
```

You don't need to remember every scoring function in the retrieval system. You only need to know:

```text
Query
    ↓
Multi-channel recall
    ↓
Candidate merging
    ↓
Evidence filtering
    ↓
File reading
    ↓
Answer or decline
```

Docs don't help you know things in finer detail.

They help you grasp the whole without entering every detail.

## Only Docs Updated in Real Time Deserve to Be Called a Map

If the code has changed but the docs are still stuck three months ago, they are no longer a mirror.

They are more like an old map.

The roads are still drawn, but the bridge is gone. You follow it to the riverbank, only to find there is no way across.

So truly useful docs can't wait to be tidied up after the project is done.

They should change together with the code.

Add a module, and add its node to the doc topology.

Change a dependency, and update the references between files.

When a temporary placeholder is filled in, remove it from the TODO or placeholder docs.

When an approach is abandoned, move it to the history directory and have the new doc point clearly to its replacement.

The state in the docs should always stay as close as possible to the state in the code:

```text
What is done
What is in progress
What is missing
What is only a temporary workaround
What happens next
```

This kind of content should not live only in human memory.

Human memory is not a reliable project management system, especially when several Agents are running at the same time.

## Commits and Docs Form a Complete Traceability Chain

Git is very good at recording what changed in the code.

Which files a Commit modified, which code it added, which implementations it removed: all of that can be traced back precisely.

But a Commit is usually not good at fully explaining what those changes mean for the system as a whole.

For example:

```text
feat: add long-term memory
```

It probably can't answer:

* whether what is stored here are facts or historical retrieval experience;
* whether Memory can enter the final answer directly;
* who wins when the current file conflicts with historical memory;
* which layers were implemented this time;
* which features are still unfinished;
* how it is meant to expand later.

Not all of this belongs in a Commit Message.

A more complete traceability chain looks like this:

```text
The code
→ how the system actually runs

The tests
→ whether current behavior matches expectations

A commit
→ what changed this time

The docs
→ why it changed, and how the system topology shifted

The history docs
→ why it wasn't like this before
```

Commits record the concrete changes.

Docs record what the changes mean.

Put them together, and when you return to the project months later, you don't have to do code archaeology again, guessing why this structure was left behind.

You can know:

* what was done;
* what was not done yet;
* what the plan was at the time;
* which directions were abandoned;
* which things were only interfaces reserved for the future.

## Doc Topology Can Also Select Context

An Agent does not get better the more it reads.

Stuffing the entire repo, all its history, and dozens of docs into it usually just creates noise.

What actually works is letting the Agent read along the doc topology, on demand.

For example, a frontend task may only need:

```text
docs/README.md
    ↓
docs/architecture/frontend.md
    ↓
docs/design/current-page.md
    ↓
docs/tasks/active/current-task.md
```

A database task may need:

```text
docs/README.md
    ↓
docs/architecture/data-ownership.md
    ↓
docs/architecture/database.md
    ↓
docs/decisions/003-migration-policy.md
```

The Agent starts from the entry file and follows links into the docs the current task truly depends on.

This is much like Import in code.

When we use a function, we don't copy the whole project into the current file. When we give an Agent a task, there's no need to make it read the project's entire history either.

A good doc topology helps an Agent gain a more accurate understanding of the project with less context.

Paths are indexes, links are edges, and the entry file handles navigation.

## Pressing Esc Less Often

We often press Esc when the Agent's Thinking has only produced half a sentence.

Because it has already shown signs of going off track.

It is about to start from the wrong module, about to re-implement something that already exists, or slipping around a boundary it should never cross.

So we interrupt it and tell it again:

> This logic belongs on the backend.
> Don't access the database directly.
> That file is out of date.
> Read the current architecture first.
> Don't touch the other module this time.
> This state is not frontend-authoritative.

When you find yourself saying the same things over and over, you should realize they shouldn't live only in chat history.

They belong in the project docs.

When the Agent can learn module relationships, sources of authority, and the scope of a change from the doc topology in advance, the number of manual corrections you need will naturally drop.

This is not only about making the Agent do better.

It also saves time for yourself.

Without docs, every new task starts with you loading the whole project back into your head, then explaining it again to the Agent in natural language.

Once the docs exist, you only need to explain what changed this time.

Not introducing the entire worldview from scratch every time.

## Docs Serve Your Future Self First

It's easy to think of `docs/` as a kind of Agent prompt.

The clearer the docs, the more stable the Agent's code.

That is certainly true.

But the first one the docs serve is actually your future self.

A few months from now, you won't remember all the code details either.

You may still remember building some system, roughly, but not:

* why another approach wasn't chosen;
* which interfaces were only temporary compatibility;
* which modules exist but are not finished;
* whether a limitation was deliberate design or just lack of time back then;
* where the next step was supposed to continue from.

If these things only exist in the chat logs and your head from back then, they will soon be gone.

A continuously updated doc topology lets you re-enter the project quickly.

It doesn't ask you to reread all the code. You just follow the relationships between files and find the backbone of the project again.

## The Doc System Doesn't Have to Be Heavy

Describing docs as a map of the code and a topology of files may sound like you need to design a complex system.

In fact, the beginning can be very light.

For example:

```text
docs/
├── README.md
├── architecture.md
├── roadmap.md
└── decisions.md
```

`README.md` is the entry, telling both humans and Agents where to start.

`architecture.md` records modules and dependencies.

`roadmap.md` records what has been done and what hasn't.

`decisions.md` records important choices and their reasons.

When files gradually grow long, split them into directories.

When decisions pile up, number them.

When old approaches stop working, build an archive.

The doc topology doesn't need to be designed in one pass.

It can grow gradually, like code.

The only thing that matters is: when you open `docs/`, can you see the current shape of the project?

## Docs Accrue Technical Debt Too

Docs are not automatically correct once written.

Directories migrate, modules get renamed, old links break, and the authority of a given doc can change.

Once docs start guiding an Agent's work, a wrong doc can be more dangerous than no doc at all.

Without docs, the Agent at least goes and reads the code.

With a clear but outdated architecture doc, it may very earnestly implement the wrong rules.

So `docs/` needs maintenance too:

* update links when restructuring directories;
* move stale docs into the archive;
* note in new docs which one they replace;
* write the current status clearly in important files;
* update the docs when code changes a boundary;
* check paths and duplicated content regularly.

If docs are a map of the code, then when the code changes, the map of course has to change too.

Otherwise it is just an old map that becomes less and less trustworthy.

## Code Makes the Project Run; Docs Keep It Understandable

Agents can help us write more and more code.

But what a project most easily loses is not the amount of code. It is the developer's understanding of the system structure.

A good `docs/` folder can be a low-detail map of the code.

Each doc is a node.

File paths are indexes.

Markdown links and references are directed edges.

The same set of files can be viewed as a list, a directory tree, or a directed graph, expressing the state and structure of the project from different angles.

It doesn't need to repeat the code, yet it preserves the module topology behind it.

Together with Commits, it forms a complete traceability chain:

```text
What was done
Why it was done this way
What hasn't been done yet
What happens next
```

It lets the Agent take fewer detours, and lets you press Esc a few times less.

And it spares your future self from rereading the code, re-understanding the project, and re-explaining the whole system, again and again.

Code is what the project looks like when it actually runs.

Docs are what the project looks like when it can still be grasped.
