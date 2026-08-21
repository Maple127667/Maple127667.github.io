---
id: "vibe-coding"
order: 1
title: "What to Look at After You Stop Reading Code: My Vibe Coding Approach"
date: "2026-07-27"
category: "AI / ENGINEERING"
excerpt: "Once you stop reading code line by line, what you really need to see is structure, module topology, information flow, and boundaries."
featured: true
---

This article was also written in a Vibe way.

I supply fragmented ideas, real experiences, and judgments I haven't fully sorted out. AI helps me find structure and fill in the expression, and then I judge whether it has drifted from what I meant.

Just like how I usually write code with AI.

I don't always prepare a rigorous outline first. Often I only know there's something here worth saying, but the pieces are still scattered across different experiences. AI can help me put the fragments together, but what the article ultimately wants to say, what should be kept, and what looks reasonable yet doesn't belong to me, those decisions are still mine.

This is also what Vibe Coding means to me now.

It isn't handing the whole project to AI and receiving a zip file at the finish line. It's more like this: I've gradually stopped watching how each line of code gets written, and moved my attention one level up. What problem the project is solving, how modules connect, where boundaries are drawn, and whether the system is still growing along the lines I expected.

## From "Can This Module Be Handed to AI" to Not Reading Code Line by Line

Early AI programming was a period when everyone was still on the DeepSeek web version, discussing "whether some module is independent enough to hand over to AI."

We would slice tasks very small, prepare context as complete as possible, paste a piece of code to the model, and then carefully check every line of implementation it returned.

Back then, AI was more like a very capable pair programmer you couldn't fully trust. It could write a function, fill in an interface, or analyze an error, but it could hardly grasp the whole project.

But with Vibe Coding now, much of the time you can already stop reading the code.

"Not reading code" here doesn't mean not understanding code at all, and it doesn't mean giving up on quality. It means reading every line of implementation is no longer the main way of working.

When an Agent can search the repo on its own, read related modules, modify multiple files, run tests, inspect errors, and keep fixing, the developer's attention naturally moves upward.

You start to care more about:

* which module this feature should belong to;
* whether modules have grown unnecessary dependencies;
* who should own the data;
* where state is born, and where it ends;
* whether a change has broken an existing boundary;
* whether the context the Agent currently has is enough;
* whether tests verify behavior, or only verify the implementation;
* which branch this change should enter, and how it gets recorded and rolled back.

We used to stare at functions and statements. Now we need to stare at the topology of the project.

## Not Needing to Watch Code Details Doesn't Mean You Only Need Ideas

Vibe Coding suits people who have ideas but whose coding skills aren't that strong.

A person no longer needs to fully master frontend, backend, databases, deployment, and testing before turning an idea into a product people can experience. AI can step over many thresholds in the traditional learning path, letting you touch the result first and gradually understand the structure behind it.

But that doesn't mean ideas alone are enough.

Code quality, coupling, module boundaries, data structures, and exception paths don't automatically disappear just because AI generated the code. On the contrary, because AI writes code far faster than humans can read it, these problems accumulate faster too.

You might only say one sentence:

> Add long-term memory to this system.

The Agent can quickly generate the database schema, storage logic, retrieval interfaces, a settings page, and a set of tests. But what "long-term memory" should actually store, whether it can enter answers directly, when it expires, how it gets deleted, and who wins when it conflicts with current facts: none of these are questions code generation can answer for you automatically.

So you can simply stop watching every code detail.

Your eyes need to be on a higher place: project structure, module topology, information flow, and boundaries of responsibility.

If modules are already tangled together, AI will only keep adding code along the existing structure, faster. If the system has no clear source of truth, it may create yet another copy of state. If tests only chase passing, it will quite naturally modify the tests to fit the current implementation.

Vibe Coding is much faster than traditional programming, but whether the system ends up stable is still in the developer's hands.

## Just do it

When people ask me how to start AI programming, I often answer with just one line:

> Just do it.

Rather than first finding a complete course, memorizing prompt tricks, or researching which Agent tool is the strongest, you might as well start building.

The best thing about Vibe Coding is how quickly it lets you see an Idea land.

The first version may be destined to be refactored, but an Idea landing quickly has value in itself.

It pulls you into a loop very quickly:

```text
Have an idea
→ see it running
→ feel the reward
→ discover new problems
→ build the next step
```

More importantly, only when an idea becomes a real thing do you know whether it's actually worth continuing.

Many designs feel complete in your head, but once actually used, you find the core need doesn't exist. Others that looked like small tools at first can gradually reveal a much larger space during use.

Building it verifies the implementation, and it also verifies the Idea itself.

## "Pressing Esc Half a Sentence into the Thinking"

We often joke that sometimes, half a sentence into the AI's Thinking, we're already pressing Esc.

Because you already know it has gone off track.

It misunderstood the task's goal, is about to modify the wrong module, or is solving the problem in a way that looks complete but doesn't fit the project's actual structure at all.

I think this is an instinct fed by a large number of Tokens.

Through continuous collaboration with Agents, you gradually develop a sensitivity to drift. You may not have read the code it will finally generate, but from what it's about to search, how it understands module relationships, and which files it chooses to modify, you can already judge whether this implementation will match expectations.

This ability is hard to gain from courses alone.

It takes a large number of real tasks, wrong judgments, rework, and refactoring. You need to see how AI confidently fills in the gaps when context is insufficient, how it places a locally optimal implementation in the wrong place, and how the same task yields completely different results under different descriptions and project structures.

This is also why I hope people just starting with Vibe Coding will Just do it first.

Only by actually building enough things can you form a feel for "it's drifting."

## AI Is Already a Qualified Assistant, but Efficiency Breeds Restlessness

AI today is already a qualified assistant.

Many things can be thrown straight at it:

* replacing search engines for finding material;
* helping with deployment and operations problems;
* acting as a translator;
* reading papers;
* reading unfamiliar code;
* analyzing errors;
* writing tests;
* organizing documentation;
* investigating a technical approach;
* generating an initial implementation you can keep modifying.

The territory one person can touch at the same time is now much larger than before.

But high efficiency brings another problem: restlessness.

Once you're used to the Agent's fast output, the moment generation slows down, the toolchain takes longer to run, or even just Token consumption slows, anxiety rises.

You start to suspect it's stuck. You want to switch models, restart the task, or open another Agent at the same time and do it all over again.

I don't mind burning through my Coding Plan a little restlessly while it still isn't used up.

The exploration phase should allow waste. Multiple Agents trying at the same time, quickly overturning an implementation, spending large amounts of Tokens to buy a sense of direction: all of these can be reasonable.

But for a project that has entered long-term maintenance, restlessness often means a cost larger than expired Tokens.

A module merged into the main chain before being thought through may cause dozens of compatibility modifications later. A boundary compromise made just to get something passing quickly may be copied by every Agent that comes after. An "optimization" lacking evaluation may only make familiar questions easier to answer while breaking other scenarios.

Tokens going unused costs you a subscription.

A project structure out of control costs you the price of every future change.

## From Vibe to Papers, Implementation, Ablation, and Evaluation

Vibe is great for starting, but it cannot decide on its own what should enter the final system.

I'm now more used to a process like this:

```text
Vibe
→ papers and material
→ minimal implementation
→ ablation experiments
→ fixed evaluation
```

The Vibe phase is responsible for getting the idea out quickly.

It doesn't need to be correct from the start. What matters most at this stage is getting feedback, observing where the real problems are, and what the system's capability ceiling might be.

Once the problem becomes clearer, I start reading papers and existing projects, and have AI help me search for material and compare approaches.

Papers aren't for copying architectures. Their job is to tell me what other ways this problem can be defined, which routes others have tried, how the experiments were designed, and which failures have already appeared.

Next comes minimal implementation.

Instead of heavily integrating a method into the system right away, first build a version that can be compared. Let it run under the same data, the same problems, and the same constraints.

Then run ablation experiments.

Turn off the component you just added and run it again.

If the system doesn't get noticeably worse with it off, or is even faster with a simpler structure, then the component may not deserve to stay in the main chain. Maybe it should be deleted, or maybe it should only be enabled under a few conditions.

Last comes fixed evaluation.

No more relying on "it answered these few questions pretty well." Instead, check recall, citation, refusal, latency, and stability. Distinguish which category of problem actually improved, and which one regressed.

In my Search Agent project, Planner, GraphRAG, HNSW, and strong reasoning models are not enabled by default just because they look advanced.

The Planner is useful, but each call adds significant latency, so it's only enabled when evidence coverage is insufficient.

GraphRAG performs well on relational questions, but it isn't suited to ordinary factual retrieval, so it was placed in a low-frequency cold layer.

HNSW vector retrieval is faster, but the current exact retrieval already takes under a millisecond, so for now there's no need to add new complexity for it.

This process isn't meant to drag Vibe Coding back into the heavy traditional development flow. It's meant to add a convergence mechanism to high-speed exploration.

Vibe proposes possibilities.

Experiments decide whether it earns the right to stay.

## Big Projects Force You to Understand Real Engineering Problems

When you vibe a small tool, many things can be ignored.

A script of only a few hundred lines can tolerate a little coupling between modules. Without complete documentation, you can just read the code again. If branches get messy, worst case you copy the directory and start over.

But as a project gradually grows, you naturally run into:

* loose coupling;
* module boundaries;
* context management;
* documentation writing;
* document archiving and knowledge ingestion;
* branch management;
* Git management;
* testing and evaluation;
* configuration management;
* observability;
* version compatibility.

Not because these concepts sound professional, but because without mastering them, it's hard to truly master a large project, and the Agents working alongside you.

The context an Agent can see each time is limited.

If the project has no documentation, it can only search the code over and over. If modules lack clear boundaries, it can hardly judge the scope of impact of a change. If branches and commit history are a mess, it also struggles to understand why a design became what it is today.

In the past, documentation was mainly written for other developers.

Now, documentation has also started to become the Agent's long-term context.

Architecture notes, module responsibilities, modification policies, testing methods, compatibility boundaries, and failure records all directly affect the quality of the code AI generates afterward.

How you organize the repository is, to some extent, deciding how the Agent understands your project.

## You Are the Project Owner, Not the Code Inspector

I don't think the ideal state of Vibe Coding is humans checking at the end whether AI wrote the syntax wrong.

Syntax, types, formatting, and unit tests should increasingly be handed to tools and to the Agents themselves.

The human's main responsibilities should gradually move upward:

* deciding what problem the project truly needs to solve;
* judging whether a requirement is worth implementing;
* designing module relationships and capability boundaries;
* controlling the speed at which complexity enters the system;
* recognizing whether an Agent is drifting;
* building tests and evaluations that expose regression;
* deciding what should be kept and what should be deleted;
* being responsible for the stability of the final system.

When you stop reading code line by line, it doesn't mean responsibility has decreased.

You've simply moved from code author to system designer, context manager, and project owner.

AI can write large amounts of code for you. It can search, deploy, translate, read papers, and troubleshoot for you.

But it won't automatically own the project for you.

Vibe Coding has driven the cost of implementation very low, and in doing so made wrong structures easier to inflate quickly. What a developer really needs to master is no longer just "how to write the feature," but "how to keep a fast-growing project still your own."

So I still say to people just starting AI programming:

> Just do it.

Build the first version first. Use it heavily first. Waste some Tokens first. Feel an Idea truly land once.

Then gradually learn to look a little higher.

Read one less line of code, look at one more module. Struggle less over some implementation detail, trace the flow of data one more time. Ask less whether AI can write it, ask more whether this thing should exist this way at all.

Vibe Coding lets us stop watching every code detail.

But after we stop reading the code, we need to see the whole project even more clearly.
