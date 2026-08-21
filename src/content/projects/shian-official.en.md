---
id: "shian-official"
order: 2
title: "诗岸_official"
headline: "诗岸_official Chatbot: How to Keep a Project from Being Just Code"
year: "2022—Present"
category: "CHATBOT / COMMUNITY PRODUCT"
excerpt: "Living in a thousand-plus group chats with five thousand users: restraint, maintenance, and listening matter more than showing every capability."
cover: "/assets/projects/shian-official-transparent-v2.webp"
coverFit: "contain"
coverBackground: "#000000"
status: "ACTIVE / MAINTAINED"
technologies: ["Python", "JavaScript", "NoneBot2", "SealDice", "LLoneBot", "OneBot 11"]
linkUrl: "https://shian-manual.top/"
linkLabel: "User Manual"
linkType: "website"
align: "left"
---

Shian now lives in over a thousand group chats and has met more than five thousand users.

I use the word "lives" because a group-chat bot isn't quite like ordinary software. It has no page of its own waiting for someone to open it, and not everyone who joins a group wants to use it. It shares one chat window with the group's members and shows up inside conversations that already exist.

So the first thing it has to learn isn't how to attract attention. It's how not to bother people.

Shian's most-used features are actually simple: chatting, daily check-ins, and dice.

None of these have any complex structure, yet they decide how most users feel about it. Is a reply too long? Does it show up too often? Can a check-in finish quickly? These details are closer to the product itself than any feature list.

## A Group Chat Isn't the Bot's Stage

When you build a chatbot, it's easy to want it to seem smarter, more proactive, more present.

When the model generates a complete, thorough answer, the developer often can't bear to cut it. If it can explain in this much detail, why not send it all?

But inside a group chat, completeness isn't always a good thing.

A group chat is an environment that already exists. People talk, joke, share pictures; some only glance at messages now and then. The bot isn't there to remake that environment. It's there to join it.

A reply that looks great on its own can feel too long inside a group chat. One proactive response might be fun, but a few in a row and it starts taking space away from normal conversation.

So I keep trimming Shian's replies.

If one sentence says it clearly, don't send three. A question someone already answered doesn't necessarily need the bot chiming in. A check-in just needs its result, not an explanation attached every time.

Sometimes subtraction is the real addition to a product.

Cutting word count means cutting screen spam.

Lowering how often it speaks up leaves room for the group's members.

Not showing every capability doesn't mean the capability isn't there. It means knowing when not to use it.

A large part of a chatbot's comfort comes from restraint.

## Code is cheap, Experience Isn't

AI keeps making code cheaper.

An idea quickly becomes a new command, a new page, a new API, a whole implementation. When it's done, the agent even tells you how many files it changed, how much capability it added, and what it could do next.

It makes it very easy for a developer to keep pushing forward and adding features.

But a finished feature doesn't mean it fits real usage.

The developer knows how to write the command, how long the system takes to respond, and how to recover after an error. That insider knowledge makes us automatically overlook many things that feel unnatural.

In real use, what I care about more are feelings that rarely show up in a development report.

Does a reply from Shian bring an ongoing conversation to a sudden stop? Does one check-in message take up too much space? Does the dice format require extra understanding from others? When the bot doesn't respond, can the user tell whether it's processing, temporarily offline, or simply didn't understand?

Questions like these can't be answered by tests alone.

I need to put Shian into real group chats and feel it the way an ordinary member does. Not scheduling a special time to accept-test features, but watching when it feels natural across a day of conversation and when it feels abrupt.

Product experience often isn't built so much as slowly trimmed into shape after real use.

Code helps me try an idea quickly, but only real use can tell me how much of that idea deserves to stay.

## Maintenance Is the Boring but Necessary Part

Maintenance isn't fun.

It's often just reading logs, restarting services, handling platform API changes, or fixing a problem that only shows up occasionally in a handful of groups.

After maintenance is done, there's rarely anything visibly new. What users see is that check-ins work again, the bot replies again, and the features that worked before keep working.

But as long as Shian stays in those group chats, someone has to do these things, even though they're genuinely tedious.

Once users grow used to a feature, it stops being just a piece of code in a repository. A service outage then affects more than an error count on a monitoring dashboard. It's a daily interaction some people had grown used to suddenly disappearing.

I won't dress maintenance up as something romantic. Most of the time it really is repetitive and trivial, and not nearly as exciting as building new features.

But once a project truly enters someone else's life, maintenance becomes the condition for it to keep existing.

Finished code only proves it once ran.

Continued maintenance is what means it can still be used today.

## Feedback Is Closer to the Product Than Code

I've built features I was very satisfied with that barely anyone ended up using.

And there are features with very simple implementations that got used again and again for a long time.

That kind of gap is valuable. It reminds me that a technical highlight in the developer's eyes doesn't equal product value in the user's.

User feedback rarely looks like a tidy requirements document.

More often, it's just one sentence:

"Why no reply today?"

"This prompt is a bit long."

Neither looks like a complex problem on its own, but they come from real use. Compared to adding a few hundred more lines of code, feedback like this tells me much more about what the product should become next.

Feedback doesn't just help me find bugs.

It changes how I understand the features.

If many people feel replies are too long, the problem may not be generation quality but that the bot shouldn't say this much at all. If a feature always needs explaining, maybe the interaction should change instead of the documentation getting longer. If a basic feature gets used every single day, it deserves more polish than any complex module.

Code answers "can it be implemented."

Feedback answers "does implementing it matter."

And the second question is usually harder, and more important.

## The Reason It Gets to Stay

I'm grateful to Shian, and not just for the user numbers it has accumulated.

What truly makes me happy is the feedback that comes out of real use.

Some people tell me a feature is fun. Some come ask what's going on when the service has issues. Someone once offered a tiny suggestion that later really did change many people's experience.

And many more people never say anything at all.

They just let Shian stay in the group, chatting occasionally, checking in, rolling the dice once in a while. The bot never became the center of the group chat, but it gradually became a natural part of the environment.

That "being allowed to stay" is itself feedback.

It means the product wasn't removed for being too noisy, and wasn't forgotten for being hard to use. Those simplest features really did enter some people's daily routines.

That feels more real to me than lines of code, module counts, or a pretty development report.

Code is cheap.

What I really want is an idea worth implementing, the comfort of using something without extra thought, and a thing that, in the end, someone is genuinely willing to use.

Code gives an idea its shape.

Maintenance keeps it existing.

And feedback is what slowly turns it into a product, not just a piece of code.
