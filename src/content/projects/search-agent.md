---
id: "search-agent"
order: 1
title: "Search Agent"
year: "2026"
category: "AI SYSTEM / 检索工程"
excerpt: "从一次接近三分钟的 Agent 检索出发，参考 23 篇论文，用固定测试集和消融实验把延迟压进秒级，构建一套渐进式、可引用的个人 Search Agent。"
cover: "/assets/projects/search-agent.webp"
status: "ACTIVE DEVELOPMENT / 快速迭代中"
technologies: ["Python", "Modular Monolith", "SQLite FTS5", "Hybrid Retrieval", "Weighted RRF", "ClaimGate"]
align: "right"
linkUrl: "https://github.com/Maple127667/search_agent"
linkLabel: "GitHub 仓库"
linkType: "github"
---

> 从三分钟检索、Vibe Coding 和 23 篇论文，到一个渐进式的个人 Search Agent

这个项目不是从一张漂亮的架构图开始的，而是从一次又一次接近三分钟的等待开始的。

我想要的其实很简单：把自己的文档、代码、表格、PDF 和长期积累的资料放进一个知识库，然后像询问一个熟悉这些资料的助手一样询问它。它应该比手动翻文件快，也应该比通用 Agent 更了解这些资料之间的结构。最重要的是，它不能只给出一个听起来正确的答案，还要告诉我答案来自哪个文件、哪一页、哪一行或者哪个单元格。

Codex 和 Claude Code 已经展示了非常完整的检索能力。它们会搜索、读取、继续搜索、交叉验证，再组织答案。问题是，这套方式面向的是开放任务：为了尽量不漏掉信息，Agent 往往愿意执行一条很长的工具链。对于一个边界清楚、资料相对稳定的个人知识库，这种完整有时反而意味着缓慢，而且搜得多并不总等于搜得更精确。

于是我开始尝试另一条路线：不追求让 Agent 每次都“聪明地自由探索”，而是把已经验证有效的检索步骤固化下来，让简单问题尽快结束，只把真正困难的问题交给更复杂的规划和推理。

目前的项目大致是这样的：

| 项目维度 | 当前规模或能力 |
|---|---:|
| 参考论文 | 23 篇 |
| 核心检索通道 | 4 种 |
| 查询路由 | 6 类 |
| 记忆层级 | 4 层 |
| 渐进执行阶段 | 5 级 |
| 已索引来源 | 1,649 个 |
| 知识分块 | 11,218 个 |
| 自动化测试 | 506 个 |

这些数字不是为了说明系统已经完成，而是为了说明：它已经从一个依赖 Agent 临场发挥的实验，逐渐变成了一套可以测量、比较和继续演进的检索系统。

---

## 为什么我要重新做一个知识库

我并不是想重新发明搜索引擎，也不是因为现有工具不会检索。恰恰相反，现有工具非常强，它们的问题是太通用。

一个通用 Agent 不知道我的知识库是否稳定，不知道哪些文件是正式资料、哪些只是旧版本，也不知道某类问题其实只需要查一个配置键。为了提高成功率，它通常会扩大搜索范围，读取多个文件，调用模型重新规划，再检查一次答案。这样的策略适合未知代码库和开放任务，但用在每天都要访问的个人知识库上，会让大量简单问题承担复杂问题的成本。

我希望这个知识库具有几项很具体的能力：

- 能处理自然语言，也能处理路径、文件名、符号、版本号和表格坐标；
- 能保留原始文件结构，而不是把所有内容压成一团文本；
- 能区分正式来源、历史版本和辅助材料；
- 能在证据不足时拒绝回答；
- 能随着使用积累检索经验，但不能把旧答案当成新的事实；
- 最终给出的引用可以回到原文件，而不是停留在某个生成出来的摘要中。

项目的目标也因此逐渐清楚：准确度优先，其次是速度；但速度不能靠删掉验证步骤获得，而应该靠更早识别“这个问题其实已经搜够了”。

---

## Vibe Coding 为什么不可靠

最初的版本非常符合 Vibe Coding 的直觉：先快速把想法做出来，再让一个强 Agent 自己寻找答案。

我尝试过让 Codex 充当“检索教师”。它帮助分析什么样的词更容易找到目标资料，我再把这些经验写成偏置数据；我还把不同格式的文件转换成容易阅读的 Markdown 镜像，并尽量保留原文件树；在线查询时，Agent 使用最基础的搜索、文件读取和继续检索工具。

这个方案在我反复试用的问题上表现得非常好。只要愿意等，它往往能够找到相当准确的答案，甚至能在第一次搜索不理想时主动换一种方式继续查。它证明了一件事：基础工具加上足够强的 Agent，确实可以构成高质量检索。

但它也暴露了一个无法回避的问题：太慢。

一次完整检索经常需要接近三分钟。等待期间，Agent 可能会经历搜索、读取、判断不足、改写查询、再次搜索、读取镜像、检查原文件，最后才开始回答。每一步单独看都合理，连在一起却形成了很长的串行链路。

后来回看，这个问题不是靠换一个更快模型就能彻底解决的。真正的问题是系统没有明确边界：

- 不知道什么时候已经拥有足够证据；
- 不知道哪些问题根本不需要模型规划；
- 相同信息可能在原文件、镜像和多个分块中反复出现；
- 每次查询都像第一次面对陌生项目，没有复用已经验证过的路线；
- 没有固定测试集，因此很难判断一次架构改动究竟是更好了，还是碰巧答对了几个熟悉的问题。

Vibe Coding 很适合把一个想法迅速变成可以体验的 Demo。它不擅长自动回答另一类问题：这个组件是否真的有用，它提升了哪类问题，又给系统增加了多少延迟和不稳定性。

第一次方案最重要的价值并不是它成为了最终架构，而是它给出了一个质量很高的上限，同时把核心矛盾暴露得非常清楚：我需要保留 Agent 能够深入查找的能力，但不能让每个问题都走完整的 Agent 链。

---

## 论文是知识的宝库，但不能照单全收

当问题从“能不能做出来”变成“怎样做得更好”，论文提供了远比继续堆提示词更丰富的答案。

这个项目前后参考了 23 篇与 RAG、混合检索、分块、路由、GraphRAG、长期记忆和评估有关的论文。它们最有价值的地方，不是提供一张可以直接复制的最终架构，而是提供大量经过定义的问题、可比较的基线和已经验证过的失败方向。

| 论文方向 | 项目采用的部分 | 没采用或收益有限的部分 |
|---|---|---|
| [RAG](https://arxiv.org/abs/2005.11401)、[DPR](https://aclanthology.org/2020.emnlp-main.550/) | 将外部检索与回答生成分离，引入语义召回 | 纯向量难以稳定处理路径、版本号、符号和精确数值 |
| [RRF](https://doi.org/10.1145/1571941.1572114)、[BEIR](https://openreview.net/forum?id=wCu6T5xFjeJ) | 融合不同检索器，并按问题类型分别评估 | 单一总分无法解释系统在哪类问题上变好或退化 |
| [Multi-View](https://aclanthology.org/2022.acl-long.414/)、[Late Chunking](https://arxiv.org/abs/2409.04701)、[RAPTOR](https://arxiv.org/abs/2401.18059) | 保留多种内容视图，使用结构边界和局部上下文 | 全量层次摘要会增加构建、更新和引用回溯成本 |
| [Self-RAG](https://arxiv.org/abs/2310.11511)、[CRAG](https://arxiv.org/abs/2401.15884)、[RouterRetriever](https://arxiv.org/abs/2409.02685) | 证据不足时升级检索，根据问题选择检索路线 | 每次都调用模型反思或路由，会让简单问题承担额外延迟 |
| [GraphRAG](https://arxiv.org/abs/2404.16130)、[HippoRAG](https://arxiv.org/abs/2405.14831)、[MemoRAG](https://arxiv.org/abs/2409.05591) | 用于关系、多跳和全局主题，并作为冷层提供线索 | Graph-only 不适合路径、数值和普通局部事实查询 |
| [Generative Agents](https://arxiv.org/abs/2304.03442)、[Mem0](https://arxiv.org/abs/2504.19413)、[A-MEM](https://arxiv.org/abs/2502.12110) | 记忆分层、时间衰减、反馈和关联检索 | 记忆直接注入答案容易把旧经验变成错误事实 |
| [RAGAS](https://aclanthology.org/2024.eacl-demo.16/)、[ARES](https://aclanthology.org/2024.naacl-long.20/)、[RAGChecker](https://arxiv.org/abs/2408.08067) | 将检索、回答、引用和拒答拆开评估 | LLM Judge 不能替代可程序化验证和人工抽查 |
| [BRIGHT](https://arxiv.org/abs/2407.12883)、[LoCoMo](https://arxiv.org/abs/2402.17753)、[LongMemEval](https://arxiv.org/abs/2410.10813) | 构造推理密集问题和跨时间记忆序列 | 公开数据集不能完全代表个人知识库中的路径、版本和权限问题 |

这些取舍不意味着没有采用的方法不好。GraphRAG 在全局主题和关系推理中有明确价值，HNSW 在大规模向量检索中也非常重要，强推理模型在复杂任务上拥有更高上限。问题只在于，它们是否适合当前项目的数据规模、问题分布和延迟目标。

例如，[GraphRAG](https://arxiv.org/abs/2404.16130) 给我最大的启发不是“所有资料都应该先建图”，而是把局部检索和全局理解区分开。普通问题仍然应该回到可引用的原文；图更适合放在低频冷层，只有关系型或全局型问题才使用。

[Self-RAG](https://arxiv.org/abs/2310.11511) 和 [CRAG](https://arxiv.org/abs/2401.15884) 则说明检索不必永远只执行一次，但项目最终没有让模型自由循环，而是把纠正性检索限制为有条件、可观察、次数有限的升级。论文提供了能力，工程实验决定了能力应该放在主链、支路还是冷层。

这也是阅读论文带来的最大变化：我不再只问“这个方法先进吗”，而是开始问“它解决的究竟是不是我的问题”。

---

## 把检索做成阶梯，而不是一条很长的 Agent 链

最终架构最重要的变化，是把一次开放式 Agent 搜索拆成逐级升级的检索阶梯。

在数据侧，原始文件仍然是唯一事实源。系统会把文档转换成带稳定标识、结构和精确位置的知识对象，再从同一份内容派生全文、中文词面、结构和向量等视图。Markdown 镜像仍然保留，因为它方便人工阅读和调试，但它不再承担“第二份事实源”的职责。

在线检索时，系统先做便宜而确定的事情：识别路径、符号、稀有关键词和问题类型，然后并行运行适合的检索通道。只有当结果没有覆盖问题要求的字段、来源不足或证据发生冲突时，才进入问题拆分、定向读取、规划模型或冷图。

![渐进式检索阶梯：从确定性路由到证据充分性判断](/assets/projects/search-agent-retrieval-staircase.webp)

简单问题和复杂问题因此走不同路线：

| 问题类型 | 默认处理方式 | 是否调用规划模型 |
|---|---|---|
| 路径、文件名、符号 | 精确检索和结构索引 | 否 |
| 普通事实问题 | BM25、中文词面和向量并行 | 通常否 |
| 多条件或多槽位问题 | 先检索，再检查必要字段是否齐全 | 缺失时调用 |
| 跨文件比较 | 来源分散、问题拆分和覆盖检查 | 按需调用 |
| 关系与全局问题 | 混合检索后进入冷图 | 按需调用 |
| 证据冲突或不足 | 定向补检，仍不足则拒答 | 可能调用 |

这种分流最直接的收益是，大部分问题不再需要 Agent 从头规划。当前正式链路的 26 个问题中，18 个直接完成，3 个做了确定性拆分，4 个在回答模型之前被拒绝，只有 1 个真正调用了规划模型。

架构演进中的速度变化也很明显：

| 架构阶段 | Recall | P50 | P95 | 当时的主要问题 |
|---|---:|---:|---:|---|
| 早期受控 Agent 链路 | 0.80 | 25.84 s | 48.10 s | 串行搜索和重复规划 |
| 最小渐进链路 | 1.00 | 14.43 s | 19.44 s | 仍有较多模型调用 |
| 当前 V3 链路 | 1.00 | 4.75 s | 7.98 s | 少数复杂问题仍有长尾 |

最初接近三分钟是开发过程中的真实体验，并不是与表中完全相同的受控实验。因此我没有把它直接放进对照表。正式对照从固定样本、固定链路和可重复运行开始，这反而体现了测试集的重要性。

分层记忆也遵循相同原则。最近对话解决追问；检索记忆保存曾经有效的路线和来源；用户明确保存的内容成为稳定知识；GraphRAG 和长期摘要进入低频冷层。记忆可以影响“先去哪里找”，但不能越过当前索引直接决定答案。最终引用仍然必须回到现在存在、现在有权限访问的原文件。

---

## 测试集和消融实验：从大量路线中筛选适合自己的方案

研究越深入，可选择的路线反而越多。

BM25、向量检索和混合检索都能工作；固定分块、结构分块、Late Chunking 和层次摘要都有依据；Planner 可以使用快模型或强模型，也可以完全不用；GraphRAG 可以全量开启，也可以只处理关系题；向量后端可以选择 NumPy、FAISS、HNSW 或独立向量数据库。

如果只阅读论文和项目介绍，几乎每条路线都有充分理由。如果把它们全部加入主链，最终得到的却可能只是一个更复杂、更慢、更难解释的系统。

测试集和消融实验因此不仅是代码完成后的验证工具，它们是这个项目最高效的路线过滤器。

![消融实验循环：从候选方案到主链、支路或移除](/assets/projects/search-agent-evaluation-loop.webp)

一个方法在消融实验中没有收益，并不代表论文错误，也不代表它在其他项目中没有价值。它只说明：在我的知识库规模、文件类型、问题分布，以及“准确优先、速度其次”的目标下，它暂时没有带来足以覆盖成本的收益。

下面几组实验直接改变了最终架构：

| 被评估组件 | 实验观察 | 最终决定 |
|---|---|---|
| 精确重复折叠 | 冗余率从 6.73% 降到 0.48%，Recall 保持 97.73%，MRR 从 0.638 升到 0.687 | 默认开启 |
| Planner | 无 Planner 质量分 0.824、P50 约 0.86 s；候选 Planner 质量分 0.884、P50 约 5.50 s | 只在证据覆盖不足时调用 |
| GraphRAG | 专门关系题表现很好；graph-only 普通 QA Recall@8 约 0.23 | 作为关系与全局问题的冷层 |
| NumPy 精确向量 | 当前 11,218 个分块上，平均查询约 0.73 ms，Recall 为 1.00 | 当前继续使用精确检索 |
| HNSW ef=128 | 平均约 0.085 ms，但相对精确结果的 Recall 约 0.994 | 数据继续扩大后再考虑 |
| 精确向量数据库替换 | 当前向量搜索本身不到 1 ms | 暂时不是主要优化方向 |
| 强推理回答模型 | 当前样本上没有稳定优于更快的回答模型，同时延迟更高 | 仅用于冲突或高风险问题 |

模型实验也改变了我对“更大的模型一定更好”的看法。在当前回答样本中，DeepSeek V4 Flash 的质量分为 1.00、P50 约 3.67 秒，Reasoner 质量分约 0.968、P50 约 4.54 秒，Qwen Coder Next 质量分为 1.00、P50 约 2.06 秒。这不是一个通用模型排行榜，只能说明在当前证据和提示协议下，更强推理模型不值得成为所有问题的默认选项。

自动化测试流带来的另一个变化，是代码修改不再只依赖手动聊天验证。现在仓库能够收集并运行 506 个测试，覆盖数据规范化、路由、混合召回、去重、引用、拒答、历史记忆、权限、文件更新和 Web 接口。固定评估集则负责回答另一类问题：质量提高了多少，速度变快了多少，哪个组件真正产生了收益。

以前的判断方式是“这次回答看起来不错”。现在可以问得更具体：它是否找到了正确来源，是否引用了正确位置，无答案问题有没有乱答，P95 是否变差，以及关闭某个组件后结果是否真的不同。

测试没有替我决定什么是最好的系统。它帮助我从众多同样合理的路线中，筛选出我真正想要的系统。

---

## 最终得到了什么，还有什么没有解决

当前版本已经不再是一条依赖模型自由发挥的长链。它能够用四个核心通道处理精确匹配、普通词面、中文表达和语义改写，再根据证据覆盖决定是否升级。原始文件仍然是事实源，回答中的证据可以回到具体路径和位置；历史和图可以提供线索，但不能替代当前证据。

在保存的 26 个正式问题上，当前链路得到以下结果：

| 指标 | 当前结果 |
|---|---:|
| Recall@8 | 1.000 |
| MRR | 0.902 |
| nDCG | 0.927 |
| 无答案判断 | 1.000 |
| 引用有效性 | 1.000 |
| P50 延迟 | 4.75 s |
| P95 延迟 | 7.98 s |

这组结果说明渐进式架构在当前样本上有效，但它还不能证明系统已经普遍优于其他检索方案。26 个问题足以筛选架构，远远不足以代表所有个人知识库；模型服务速度也会随网络和负载变化。

长期记忆目前只完成了小规模场景验证。它能保存有界的检索先验、接受正负反馈，也能够显式删除，但还需要更长时间跨度、更频繁的文件更新和更多相似问题交错，才能判断是否真的不会产生负迁移。

当前一万级分块也没有验证百万级数据和高并发场景。NumPy 精确检索在现在很合适，不代表它永远是最佳选择。当数据规模、过滤要求和并发量发生变化时，HNSW 或独立向量数据库可能重新变得有价值。

还有一个更难的问题是测试集本身。只要开发者反复根据同一批问题调整系统，测试集就可能逐渐变成训练集。因此，后续需要扩充盲测问题、无答案诱饵、版本冲突和跨时间记忆序列，并保留一部分在日常开发中不可见的数据。

这个项目现在得到的不是一个“最终正确”的答案，而是一种更可靠的演进方式：先把想法做成最小组件，再通过固定问题和消融实验决定它应该进入主链、按需启用，还是暂时删除。

---

## 未来期望：让历史检索经验持续缩短检索链路

未来最吸引我的方向，是让系统从历史检索中学习。但它学习的不是答案，而是寻找答案的方法。

第一次面对一个陌生问题时，系统可能需要尝试多个通道，拆分问题、扩大范围，甚至调用规划模型。如果这次检索最终成功，那么真正值得保留的不只是最终答案，还包括过程中的经验：什么查询改写有效，哪个知识区域最可能包含答案，哪些来源更权威，哪些工具调用没有带来新信息，以及这个问题是否真的需要 Planner。

当相似问题再次出现时，系统可以利用这些经验更早选择正确路线。过去成功的关键词可以成为查询扩展，过去有效的来源可以获得有限的排序加权，过去反复无效的昂贵步骤可以被跳过。这样得到的加速不是简单缓存答案，而是减少寻找证据时走过的弯路。

历史也可能带来危险。原始文件会更新，用户关注的版本会变化，相似的句子也可能属于完全不同的任务。如果系统把历史经验当成事实，它会变得越来越自信，也越来越容易固化错误。

因此，历史只能作为检索先验。它推荐“先去哪里找”，当前索引负责回答“现在是否仍然存在这样的证据”。每次使用历史经验，都要重新检查当前文件、版本、权限和查询锚点；一旦历史与当前证据冲突，应当始终以当前原文件为准。

我希望它最终形成一种比较克制的学习方式：不会因为记住过去而变得武断，而是因为积累了检索经验，能够用更短的路径重新找到仍然有效的证据。相似问题再次出现时，它应该更快，需要的工具和模型调用应该更少，但准确率、引用和拒答能力不能因此下降。

如果这个方向能够成立，个人知识库就不再只是一个不断加入新文件的静态索引。它会逐渐形成一套属于使用者自己的检索习惯：知道哪些资料最可信，知道不同问题应该从哪里开始，也知道什么时候已经找到了足够的证据。

---

## 参考论文

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
