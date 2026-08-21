---
id: "search-agent"
order: 1
title: "Search Agent"
year: "2026"
category: "AI SYSTEM / RETRIEVAL ENGINEERING"
excerpt: "From three-minute agent searches and 23 papers to a progressive, citable personal Search Agent, with latency cut to seconds through fixed test sets and ablations."
cover: "/assets/projects/search-agent.webp"
status: "ACTIVE DEVELOPMENT / RAPID ITERATION"
technologies: ["Python", "Modular Monolith", "SQLite FTS5", "Hybrid Retrieval", "Weighted RRF", "ClaimGate"]
align: "right"
linkUrl: "https://github.com/Maple127667/search_agent"
linkLabel: "GitHub Repo"
linkType: "github"
---

> From three-minute searches, Vibe Coding, and 23 papers to a progressive personal Search Agent

This project didn't start from a pretty architecture diagram. It started from one wait after another, each close to three minutes.

What I wanted was actually simple: put my documents, code, spreadsheets, PDFs, and years of accumulated material into one knowledge base, then ask it questions the way I'd ask an assistant who knows that material well. It should be faster than digging through files by hand, and it should understand the structure between these sources better than a general-purpose agent. Most importantly, it can't just give an answer that sounds right. It has to tell me which file, which page, which line, or which cell the answer came from.

Codex and Claude Code have already shown what a complete retrieval loop looks like. They search, read, search again, cross-validate, and then compose an answer. The problem is that this approach targets open-ended tasks: to avoid missing information, the agent is willing to run a very long tool chain. For a personal knowledge base with clear boundaries and relatively stable material, that completeness often just means slowness, and searching more doesn't always mean searching more precisely.

So I started trying a different route: instead of letting the agent "explore freely and cleverly" every time, I fixed the retrieval steps that had proven effective, let simple questions finish as early as possible, and handed only the genuinely hard ones to more complex planning and reasoning.

The project currently looks roughly like this:

| Dimension | Current scale or capability |
|---|---:|
| Reference papers | 23 |
| Core retrieval channels | 4 |
| Query routes | 6 |
| Memory tiers | 4 |
| Progressive execution stages | 5 |
| Indexed sources | 1,649 |
| Knowledge chunks | 11,218 |
| Automated tests | 506 |

These numbers aren't meant to show the system is finished. They show that it has gradually turned from an experiment relying on the agent improvising into a retrieval system that can be measured, compared, and kept evolving.

---

## Why I Built My Own Knowledge Base

I wasn't trying to reinvent the search engine, and it wasn't that existing tools couldn't retrieve. Quite the opposite: existing tools are very strong. Their problem is that they're too general.

A general-purpose agent doesn't know whether my knowledge base is stable, doesn't know which files are authoritative and which are just old versions, and doesn't know that a certain class of question only needs one config key looked up. To raise its success rate, it usually widens the search, reads multiple files, calls a model to re-plan, and checks the answer one more time. That strategy suits unknown codebases and open-ended tasks, but applied to a personal knowledge base I visit every day, it makes a large number of simple questions pay the cost of complex ones.

I wanted this knowledge base to have a few very specific capabilities:

- Handle natural language as well as paths, file names, symbols, version numbers, and spreadsheet coordinates;
- Preserve the original file structure instead of flattening everything into one blob of text;
- Distinguish authoritative sources, historical versions, and auxiliary material;
- Refuse to answer when the evidence is insufficient;
- Accumulate retrieval experience with use, without treating old answers as new facts;
- Produce citations that lead back to the original file, not to some generated summary.

The project's goal gradually became clear: accuracy first, speed second. But speed shouldn't come from deleting verification steps. It should come from recognizing earlier that "this question has already been searched enough."

---

## Why Vibe Coding Isn't Reliable

The first version followed the Vibe Coding instinct closely: build the idea quickly, then let a strong agent find the answers on its own.

I tried having Codex act as a "retrieval teacher." It helped analyze which kinds of terms were more likely to find the target material, and I turned those lessons into bias data. I also converted files in different formats into easy-to-read Markdown mirrors, keeping the original file tree as much as possible. At query time, the agent used only the most basic tools: search, file read, and continue-searching.

This approach performed remarkably well on the questions I tried repeatedly. As long as I was willing to wait, it could usually find fairly accurate answers, and it would even switch tactics on its own when the first search fell short. It proved one thing: basic tools plus a strong enough agent really can make up high-quality retrieval.

But it also exposed a problem I couldn't avoid: it was too slow.

A full retrieval often took close to three minutes. During the wait, the agent might search, read, judge the evidence insufficient, rewrite the query, search again, read the mirror, check the original file, and only then start answering. Each step looked reasonable on its own; chained together, they formed a very long serial path.

Looking back, this wasn't a problem a faster model could fully solve. The real problem was that the system had no clear boundaries:

- It didn't know when it already had enough evidence;
- It didn't know which questions didn't need model planning at all;
- The same information could appear repeatedly in the original file, the mirror, and multiple chunks;
- Every query was treated like the first encounter with an unfamiliar project, with no reuse of already proven routes;
- There was no fixed test set, so it was hard to tell whether an architecture change was actually better or just happened to answer a few familiar questions correctly.

Vibe Coding is great for turning an idea into a demo you can experience quickly. What it can't answer automatically is a different set of questions: is this component actually useful, which class of questions does it improve, and how much latency and instability does it add to the system.

The first approach's most important value wasn't that it became the final architecture. It set a high quality ceiling while exposing the core tension very clearly: I needed to keep the agent's ability to dig deep, but I couldn't let every question walk the full agent chain.

---

## Papers Are a Treasure Trove, but You Can't Take Everything

Once the question shifted from "can this be built" to "how can it be built better," papers offered far richer answers than piling on more prompts.

Across the project I referenced 23 papers on RAG, hybrid retrieval, chunking, routing, GraphRAG, long-term memory, and evaluation. Their greatest value wasn't a final architecture I could copy directly. It was the large number of well-defined problems, comparable baselines, and already-validated dead ends.

| Paper direction | What the project adopted | What was not adopted or had limited payoff |
|---|---|---|
| [RAG](https://arxiv.org/abs/2005.11401), [DPR](https://aclanthology.org/2020.emnlp-main.550/) | Separating external retrieval from answer generation; introducing semantic recall | Pure vectors struggle to reliably handle paths, version numbers, symbols, and exact numbers |
| [RRF](https://doi.org/10.1145/1571941.1572114), [BEIR](https://openreview.net/forum?id=wCu6T5xFjeJ) | Fusing different retrievers and evaluating by question type | A single aggregate score can't explain where the system improved or regressed |
| [Multi-View](https://aclanthology.org/2022.acl-long.414/), [Late Chunking](https://arxiv.org/abs/2409.04701), [RAPTOR](https://arxiv.org/abs/2401.18059) | Keeping multiple content views; using structural boundaries and local context | Full hierarchical summarization adds build, update, and citation-tracing costs |
| [Self-RAG](https://arxiv.org/abs/2310.11511), [CRAG](https://arxiv.org/abs/2401.15884), [RouterRetriever](https://arxiv.org/abs/2409.02685) | Escalating retrieval when evidence is insufficient; choosing retrieval routes by question | Calling a model to reflect or route every time makes simple questions pay extra latency |
| [GraphRAG](https://arxiv.org/abs/2404.16130), [HippoRAG](https://arxiv.org/abs/2405.14831), [MemoRAG](https://arxiv.org/abs/2409.05591) | For relational, multi-hop, and global-topic questions, and as a cold tier providing clues | Graph-only doesn't suit path, numeric, or ordinary local-fact queries |
| [Generative Agents](https://arxiv.org/abs/2304.03442), [Mem0](https://arxiv.org/abs/2504.19413), [A-MEM](https://arxiv.org/abs/2502.12110) | Memory tiers, temporal decay, feedback, and associative retrieval | Injecting memory directly into answers easily turns old experience into false facts |
| [RAGAS](https://aclanthology.org/2024.eacl-demo.16/), [ARES](https://aclanthology.org/2024.naacl-long.20/), [RAGChecker](https://arxiv.org/abs/2408.08067) | Evaluating retrieval, answering, citation, and refusal separately | An LLM Judge can't replace programmatic verification and manual spot checks |
| [BRIGHT](https://arxiv.org/abs/2407.12883), [LoCoMo](https://arxiv.org/abs/2402.17753), [LongMemEval](https://arxiv.org/abs/2410.10813) | Constructing reasoning-intensive questions and cross-time memory sequences | Public datasets can't fully represent the path, version, and permission issues in a personal knowledge base |

These trade-offs don't mean the methods I didn't adopt are bad. GraphRAG has clear value for global topics and relational reasoning, HNSW matters a lot in large-scale vector search, and strong reasoning models have a higher ceiling on complex tasks. The only question is whether they fit this project's data scale, question distribution, and latency goals.

For example, the biggest lesson [GraphRAG](https://arxiv.org/abs/2404.16130) taught me wasn't "build a graph over all your material first," but to separate local retrieval from global understanding. Ordinary questions should still go back to citable source text; the graph belongs in a low-frequency cold tier, used only for relational or global questions.

[Self-RAG](https://arxiv.org/abs/2310.11511) and [CRAG](https://arxiv.org/abs/2401.15884) showed that retrieval doesn't have to run exactly once, but the project never let the model loop freely. Instead, corrective retrieval was constrained to conditional, observable, count-limited escalation. Papers provide capabilities; engineering experiments decide whether a capability belongs in the main chain, a side branch, or the cold tier.

That was the biggest change reading papers brought me: I stopped asking only "is this method state of the art" and started asking "is the problem it solves actually my problem."

---

## Retrieval as a Staircase, Not One Long Agent Chain

The most important change in the final architecture was splitting one open-ended agent search into a retrieval staircase that escalates level by level.

On the data side, the original files remain the single source of truth. The system converts documents into knowledge objects with stable identifiers, structure, and precise positions, then derives full-text, Chinese lexical, structural, and vector views from the same content. The Markdown mirror is still kept because it's convenient for human reading and debugging, but it no longer serves as a "second source of truth."

At query time, the system does the cheap and deterministic things first: identify paths, symbols, rare keywords, and question type, then run the suitable retrieval channels in parallel. Only when the results don't cover the fields the question asks for, sources are insufficient, or evidence conflicts does it move on to question decomposition, targeted reads, a planning model, or the cold graph.

![The progressive retrieval staircase: from deterministic routing to evidence sufficiency checks](/assets/projects/search-agent-retrieval-staircase.webp)

Simple and complex questions therefore take different routes:

| Question type | Default handling | Planning model invoked? |
|---|---|---|
| Paths, file names, symbols | Exact retrieval and structural index | No |
| Ordinary factual questions | BM25, Chinese lexical, and vector in parallel | Usually no |
| Multi-condition or multi-slot questions | Retrieve first, then check that required fields are complete | Called when fields are missing |
| Cross-file comparison | Source spreading, question decomposition, and coverage checks | Called as needed |
| Relational and global questions | Hybrid retrieval, then into the cold graph | Called as needed |
| Conflicting or insufficient evidence | Targeted supplementary retrieval; refuse if still insufficient | Possibly called |

The most direct payoff of this routing is that most questions no longer need the agent to plan from scratch. Of the 26 questions on the current production chain, 18 complete directly, 3 undergo deterministic decomposition, 4 are refused before reaching the answering model, and only 1 actually invokes the planning model.

The speed changes across architecture iterations are also clear:

| Architecture stage | Recall | P50 | P95 | Main problem at the time |
|---|---:|---:|---:|---|
| Early controlled agent chain | 0.80 | 25.84 s | 48.10 s | Serial searching and repeated planning |
| Minimal progressive chain | 1.00 | 14.43 s | 19.44 s | Still many model calls |
| Current V3 chain | 1.00 | 4.75 s | 7.98 s | A few complex questions still have a long tail |

The original near-three-minute figure was real experience during development, not a controlled experiment identical to the ones in the table, so I didn't put it directly into the comparison. Formal comparison starts from fixed samples, fixed chains, and repeatable runs, which itself demonstrates why the test set matters.

Layered memory follows the same principle. Recent conversation handles follow-ups; retrieval memory keeps routes and sources that once worked; content the user explicitly saves becomes stable knowledge; GraphRAG and long-term summaries go into the low-frequency cold tier. Memory can influence "where to look first," but it can't bypass the current index and decide the answer directly. Final citations must still go back to original files that exist now and that I currently have permission to access.

---

## Test Sets and Ablations: Filtering Many Plausible Routes Down to the One That Fits

The deeper the research went, the more routes there were to choose from.

BM25, vector search, and hybrid retrieval all work; fixed chunking, structural chunking, Late Chunking, and hierarchical summarization all have their justification; the Planner can use a fast model, a strong model, or none at all; GraphRAG can be fully enabled or handle only relational questions; the vector backend can be NumPy, FAISS, HNSW, or a standalone vector database.

If you only read papers and project write-ups, almost every route has a solid rationale. Add them all to the main chain, though, and what you end up with may just be a more complex, slower, harder-to-explain system.

So the test set and ablation experiments aren't just verification tools for after the code is done. They are this project's most efficient route filter.

![The ablation loop: from candidate approach to main chain, side branch, or removal](/assets/projects/search-agent-evaluation-loop.webp)

A method showing no gain in an ablation doesn't mean the paper is wrong, or that it has no value in other projects. It only means that, given my knowledge base's scale, file types, question distribution, and the "accuracy first, speed second" goal, it hasn't yet delivered gains that cover its costs.

The following experiments directly changed the final architecture:

| Component evaluated | Experimental observation | Final decision |
|---|---|---|
| Exact duplicate folding | Redundancy dropped from 6.73% to 0.48%, Recall held at 97.73%, MRR rose from 0.638 to 0.687 | On by default |
| Planner | Without Planner: quality 0.824, P50 ~0.86 s; with candidate Planner: quality 0.884, P50 ~5.50 s | Invoked only when evidence coverage is insufficient |
| GraphRAG | Strong on dedicated relational questions; graph-only ordinary QA Recall@8 ~0.23 | Cold tier for relational and global questions |
| NumPy exact vectors | On the current 11,218 chunks: average query ~0.73 ms, Recall 1.00 | Keep exact retrieval for now |
| HNSW ef=128 | Average ~0.085 ms, but recall relative to exact results ~0.994 | Reconsider when the data grows |
| Replacing with a vector database | Vector search itself is under 1 ms today | Not a primary optimization direction for now |
| Strong reasoning answer model | Not consistently better than faster answer models on the current sample, with higher latency | Reserved for conflicting or high-risk questions |

The model experiments also changed my assumption that "a bigger model is always better." On the current answering sample, DeepSeek V4 Flash scores 1.00 quality with P50 ~3.67 s, the Reasoner scores ~0.968 with P50 ~4.54 s, and Qwen Coder Next scores 1.00 with P50 ~2.06 s. This isn't a general model leaderboard. It only shows that under the current evidence and prompting protocol, a stronger reasoning model doesn't deserve to be the default for every question.

Another change the automated test flow brought is that code changes no longer rely solely on manual chat verification. The repo now collects and runs 506 tests covering data normalization, routing, hybrid recall, deduplication, citation, refusal, historical memory, permissions, file updates, and the web interface. The fixed evaluation set answers a different set of questions: how much did quality improve, how much faster did it get, and which component actually produced the gain.

The old way of judging was "this answer looks pretty good." Now I can ask more specific questions: did it find the right source, did it cite the right location, did it hallucinate on unanswerable questions, did P95 get worse, and does turning off a component actually change the result.

The tests didn't decide for me what the best system is. They helped me filter the system I actually want out of many equally reasonable routes.

---

## What I Ended Up With, and What Remains Unsolved

The current version is no longer one long chain that depends on the model improvising. It handles exact matches, ordinary lexical queries, Chinese phrasing, and semantic paraphrases through four core channels, then decides whether to escalate based on evidence coverage. Original files remain the source of truth, and the evidence in an answer can be traced back to concrete paths and positions. History and the graph can provide clues, but they can't replace current evidence.

On the 26 saved production questions, the current chain produces these results:

| Metric | Current result |
|---|---:|
| Recall@8 | 1.000 |
| MRR | 0.902 |
| nDCG | 0.927 |
| Unanswerable detection | 1.000 |
| Citation validity | 1.000 |
| P50 latency | 4.75 s |
| P95 latency | 7.98 s |

These results show the progressive architecture works on the current sample, but they don't yet prove the system is generally better than other retrieval approaches. Twenty-six questions are enough to filter an architecture, nowhere near enough to represent every personal knowledge base; model serving speed also varies with network and load.

Long-term memory has so far only passed small-scale scenario validation. It can store bounded retrieval priors, accept positive and negative feedback, and be explicitly deleted, but it will take longer time spans, more frequent file updates, and more interleaving of similar questions to know whether it truly avoids negative transfer.

The current ten-thousand-scale chunks haven't validated million-scale data or high-concurrency scenarios either. NumPy exact retrieval is a good fit now, but that doesn't mean it's the best choice forever. When data scale, filtering requirements, and concurrency change, HNSW or a standalone vector database may become valuable again.

There's also a harder problem: the test set itself. As long as the developer keeps tuning the system against the same batch of questions, the test set can gradually turn into a training set. So going forward I need to add blind-test questions, unanswerable decoys, version conflicts, and cross-time memory sequences, and keep a portion of the data invisible during day-to-day development.

What this project has arrived at isn't a "finally correct" answer, but a more reliable way to evolve: build an idea into a minimal component first, then use fixed questions and ablations to decide whether it enters the main chain, gets enabled on demand, or is removed for now.

---

## Looking Ahead: Letting Past Retrieval Experience Keep Shortening the Chain

The direction that attracts me most is letting the system learn from past retrieval. But what it learns isn't the answers. It's the method for finding them.

Facing an unfamiliar question for the first time, the system may need to try multiple channels, decompose the question, widen the scope, or even invoke the planning model. If that retrieval eventually succeeds, what's worth keeping isn't just the final answer but the experience from the process: which query rewrites worked, which knowledge region most likely holds the answer, which sources are more authoritative, which tool calls brought no new information, and whether this question really needed the Planner.

When a similar question appears again, the system can use this experience to pick the right route earlier. Keywords that worked before can become query expansions, sources that proved effective can get limited ranking boosts, and expensive steps that repeatedly failed can be skipped. The speedup here isn't simply caching answers; it's reducing the detours taken while looking for evidence.

History can also be dangerous. Original files get updated, the versions the user cares about change, and similar sentences can belong to completely different tasks. If the system treats historical experience as fact, it grows more and more confident, and errors become easier and easier to entrench.

So history can only serve as a retrieval prior. It suggests "where to look first"; the current index answers "does such evidence still exist right now." Every use of historical experience must re-check the current files, versions, permissions, and query anchors. The moment history conflicts with current evidence, the current original file always wins.

I hope it ends up as a fairly restrained way of learning: not becoming dogmatic because it remembers the past, but using accumulated retrieval experience to re-find still-valid evidence along shorter paths. When a similar question appears again, it should be faster and need fewer tool and model calls, while accuracy, citation, and refusal ability must not decline because of it.

If this direction holds, a personal knowledge base stops being just a static index that keeps absorbing new files. It gradually forms a set of retrieval habits that belong to its user: knowing which material is most trustworthy, knowing where different questions should start, and knowing when enough evidence has already been found.

---

## References

1. Lewis et al., [Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks](https://arxiv.org/abs/2005.11401), 2020.
2. Karpukhin et al., [Dense Passage Retrieval for Open-Domain Question Answering](https://aclanthology.org/2020.emnlp-main.550/), 2020.
3. Cormack et al., [Reciprocal Rank Fusion Outperforms Condorcet and Individual Rank Learning Methods](https://doi.org/10.1145/1571941.1572114), 2009.
4. Thakur et al., [BEIR: A Heterogeneous Benchmark for Zero-shot Evaluation of Information Retrieval Models](https://openreview.net/forum?id=wCu6T5xFjeJ), 2021.
5. Wang et al., [Multi-View Document Representation Learning for Open-Domain Dense Retrieval](https://aclanthology.org/2022.acl-long.414/), 2022.
6. Sarthi et al., [RAPTOR: Recursive Abstractive Processing for Tree-Organized Retrieval](https://arxiv.org/abs/2401.18059), 2024.
7. Günther et al., [Late Chunking: Contextual Chunk Embeddings Using Long-Context Embedding Models](https://arxiv.org/abs/2409.04701), 2024.
8. Liu et al., [Lost in the Middle: How Language Models Use Long Contexts](https://arxiv.org/abs/2307.03172), 2023.
9. Asai et al., [Self-RAG: Learning to Retrieve, Generate, and Critique through Self-Reflection](https://arxiv.org/abs/2310.11511), 2023.
10. Yan et al., [Corrective Retrieval Augmented Generation](https://arxiv.org/abs/2401.15884), 2024.
11. Varkel and Globerson, [RouterRetriever: Exploring the Benefits of Routing over Multiple Expert Embedding Models](https://arxiv.org/abs/2409.02685), 2024.
12. Edge et al., [From Local to Global: A Graph RAG Approach to Query-Focused Summarization](https://arxiv.org/abs/2404.16130), 2024.
13. Gutiérrez et al., [HippoRAG: Neurobiologically Inspired Long-Term Memory for Large Language Models](https://arxiv.org/abs/2405.14831), 2024.
14. Park et al., [Generative Agents: Interactive Simulacra of Human Behavior](https://arxiv.org/abs/2304.03442), 2023.
15. Xu et al., [Mem0: Building Production-Ready AI Agents with Scalable Long-Term Memory](https://arxiv.org/abs/2504.19413), 2025.
16. Zhang et al., [A-MEM: Agentic Memory for LLM Agents](https://arxiv.org/abs/2502.12110), 2025.
17. Qian et al., [MemoRAG: Moving towards Next-Gen RAG Via Memory-Inspired Knowledge Discovery](https://arxiv.org/abs/2409.05591), 2024.
18. Es et al., [RAGAS: Automated Evaluation of Retrieval Augmented Generation](https://aclanthology.org/2024.eacl-demo.16/), 2024.
19. Saad-Falcon et al., [ARES: An Automated Evaluation Framework for Retrieval-Augmented Generation Systems](https://aclanthology.org/2024.naacl-long.20/), 2024.
20. Ru et al., [RAGChecker: A Fine-grained Framework for Diagnosing Retrieval-Augmented Generation](https://arxiv.org/abs/2408.08067), 2024.
21. Su et al., [BRIGHT: A Realistic and Challenging Benchmark for Reasoning-Intensive Retrieval](https://arxiv.org/abs/2407.12883), 2024.
22. Maharana et al., [LoCoMo: Evaluating Very Long-term Conversational Memory of LLM Agents](https://arxiv.org/abs/2402.17753), 2024.
23. Wu et al., [LongMemEval: Benchmarking Chat Assistants on Long-Term Interactive Memory](https://arxiv.org/abs/2410.10813), 2024.
