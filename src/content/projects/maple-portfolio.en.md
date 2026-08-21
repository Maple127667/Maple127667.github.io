---
id: "maple-portfolio"
order: 4
title: "Maple Portfolio"
headline: "Maple Portfolio: This Site Was Never Fully Planned"
year: "2026"
category: "FRONTEND / INTERACTIVE PORTFOLIO"
excerpt: "No design draft survived from day one. This site slowly found its shape through rounds of generation, trial, rejection, and rollback."
cover: "/assets/projects/maple-portfolio.webp"
status: "ACTIVE DEVELOPMENT / ALWAYS POLISHING"
technologies: ["JavaScript", "React 19", "Three.js", "WebGL", "Vite 6", "React Markdown"]
linkUrl: "https://github.com/Maple127667/Maple127667.github.io"
linkLabel: "GitHub Repo"
linkType: "github"
align: "right"
---

This site has no design draft that survived from day one to now.

At the very beginning, I only said a few things: dark colors, a starry sky, a restrained touch of sci-fi. A personal intro on the left, and enough room left open on the right so the picture could breathe.

Back then I had no complete page structure, and I hadn't figured out how projects, articles, and the tech stack should connect. I only knew I wanted a certain feeling.

Later, my chats with Codex about this site grew longer and longer.

There were rarely answers that passed on the first try. More often, what I said was "no," "change it back," "this part can stay," and "commit for now."

Looking back now, those repetitions weren't discarded drafts outside the final page. They were the real formation process of this portfolio.

## At First, I Only Knew What Feeling I Wanted

I didn't want to build a standard personal homepage made of a white background, cards, an avatar, and skill progress bars.

That kind of page is certainly clear and easy to use, but it has little to do with me. I wanted to keep a bit of distance and unknown, so that when visitors enter the site, they first feel a space, and only slowly see the person and the work inside it.

That's how the black-blue, the starry sky, and the three asteroids appeared.

At first, the asteroids only needed to be "cooler." Once they were actually in the picture, I started asking: is this real three-body motion, or a preset animation that just looks like orbits? Why does it look two-dimensional? Why does it follow the same route every time? After a collision, can they shatter, then regroup into the next round of motion?

These questions gradually turned a background decoration into a scene that actually runs.

At the same time, I realized the site couldn't only hold projects. I also wanted to write articles, to record the judgments, failures, and ideas that are hard to squeeze into a project description. So the portfolio stopped being just a list of "what I've done" and began to hold "how I see these things" too.

The first version didn't answer every question. It just turned an originally vague feeling into something that could be seen, used, and pointed at when something was wrong.

## Only After Building It Did I Know What Was Wrong

Some versions were beautiful at first glance.

The visuals filled the whole screen, the section transitions were strong, and projects and articles were folded into exquisite layouts. Take a single screenshot, and it even looked like a finished design.

But once I actually scrolled, I tired quickly.

Articles came right after projects, the content was hidden in collapsible bars, and visitors had to keep deciding where to click next. The page looked rich, but the reading flow had no focus. Some schemes were like film storyboards or posters: atmospheric as concept art, but not really usable inside a real website.

This is where "building it" finally showed its value.

An idea that stays in text can always be imagined smoothly. Once it becomes a page, the font size is too small, the cover gets cropped, the animation drags on too long, and a beautiful composition may leave the real content with nowhere to go.

Codex can turn an idea into a runnable version very quickly. It also produces complete, reasonable, even quite refined proposals. But complete doesn't mean it suits me, and runnable doesn't mean it deserves to stay.

I need to see it first before I know what exactly I'm against.

## The Frontend Has Always Been the Part I Was Unhappy With

For a long time, I felt I wasn't a qualified full-stack engineer.

Not because I couldn't build pages. Data, state, APIs, and deployment were all doable, and the features ran fine. What truly dissatisfied me was that what finally appeared on screen was often just "usable," without the rhythm and character I wanted.

So I went to Awwwards and looked through dozens of sites in a row.

I wasn't trying to pick a visual style and carry it straight back. The more I looked, the more I realized that so-called "good looks" don't come from a set of trendy effects. Where the first glance lands, why text and imagery leave at that particular moment, how the next section inherits the space of the previous one, even why an accent color can only appear in certain positions: these judgments together decide whether a whole page holds up.

This process also changed how I examined my own pages. The problem was no longer that one color or one card was ugly, but whether, once put together, they formed a clear hierarchy, a continuous space, and a natural reading rhythm.

What I called "too flat" meant the name, badges, and content all looked pasted onto the screen, moving along with the whole picture when the page scrolled, with no front-to-back relationship. What I called "twitching cards" meant that on hover a card would scale up while recalculating the mouse position, so the visual focus kept drifting instead. What I called "the acid-lime looks weird" wasn't a problem with the color itself, but that after one card covered the old green, a new patch of green appeared out of nowhere on the next layer, with no continuity between the two states.

The copy was the same.

Translating English labels directly into Chinese often just finished the translation without becoming natural Chinese. A sentence like "converging into a capability system" isn't wrong in meaning, but placed on a page it reads like an auto-generated summary. I kept cutting and swapping words until it sounded like something I would actually say.

There was an acid-lime slash whose angle, occlusion, size, and so-called three-dimensionality I adjusted back and forth. After many revisions, I finally decided to delete it, and only color the words that truly mattered.

That work wasn't wasted.

It was exactly those versions that didn't hold up that showed me the problem wasn't in some parameter, but in the whole idea itself.

## Keep What Works, Then Overturn the Rest

Once, I stopped and first confirmed which parts already held up.

The sketch-style image and the simple card were good. The way text exited left and the three-body scene gradually faded when moving from the first page to the second was good too. Beyond that, many of the animations needed rethinking.

That's different from "redo everything."

I started leaving commits and checkpoints for important states. Not because they were already perfect, but to record: at this moment, which judgments had been confirmed, and where later experiments should continue from. If a new direction didn't hold up, I'd come back here, instead of polishing on top of layer after layer of patches.

The site has seen a space station, a technical report, stamps, an archive desk, a ring of cards, and tag sorting. Some of these stayed only briefly. Some were built to the point of being interactive and were still withdrawn in the end.

Time already invested can't be a reason a design must stay.

Conversely, needing to overturn the whole doesn't mean the truly good parts have to disappear with it.

What I slowly learned was to separate "can't bear to let go" from "whether it fits."

## Animations Also Have to Explain Why They Move This Way

I like animations, but I've grown to dislike making every element perform once just to prove the page can move.

If a project enters from the right, then after it leaves, the next section should inherit that spatial relationship. If cards rotate in a ring, the mouse should change the angle from which you observe the ring, not make one card suddenly grow. When the tech stack exits, the whole page shouldn't mechanically slide up and disappear either. Each group of content should leave along the path that matches where it entered from.

I once tried having each project's tech tags fly out of the cards, align and sort along the far right, then scatter into the tech stack page.

The idea sounded complete, but the actual effect didn't hold up. The text didn't look like it was leaving its original position, and the endpoints didn't line up. Even when the same words appeared on screen, they still felt like two different batches of elements. You couldn't believe that what happened before and after was the same motion.

In the end, I rolled back the whole scheme.

It confirmed one thing for me: an animation needs not only a start and an end, it also has to preserve the identity of the object. Visitors don't need to understand the implementation, but they should instinctively believe that "it really came from there, and now it's here."

Complex doesn't equal natural. Only what can clearly explain why it moves deserves to move.

## Codex Works Fast, but the Judgment Is Still Mine

A large part of this site was built in conversation with Codex.

It can look up code, rework layouts, and add animations very quickly, and it can deliver the next version immediately after a direction gets rejected. That let me try many things that might otherwise have stayed in my imagination.

But speed brings another kind of problem.

A proposal can become very complete in a short time. The title, the description, the buttons, and the animations are all there, looking like a finished product with a clear design language. The more complete it is, the easier it is to temporarily overlook that this language may not belong to me at all.

That's why the chat history keeps repeating "too AI-generated," "this sentence is too cringe," "the frame is ugly," and "change it back."

These remarks aren't evidence of a failed collaboration.

They record how I went from someone who could only describe a rough feeling to someone who can judge continuity, hierarchy, reasons for motion, and tone of voice. Codex's job is to get ideas into an experienceable state as fast as possible. My job is to decide whether they've drifted, and to carry the choice of what finally stays.

This site will still change.

It won't prove that I knew the answers from the start. What it preserves is something more honest: how I turned a vague feeling into something real, how I saw where it didn't resemble me, and how I pulled it back toward my own direction, again and again.

What finally remains on the page isn't only what can be generated.

There's also everything I carefully decided not to keep.
