---
id: "maim-desktop-pet"
order: 5
title: "MaiM Desktop Pet"
headline: "MaiM Desktop Pet: Keep the Character on the Desktop, and Leave Room for Work"
year: "Ongoing"
category: "DESKTOP / LIVE2D"
excerpt: "Not a portrait floating on the screen forever, but a desktop character that responds, keeps you company, and knows when to quiet down."
cover: "/assets/projects/maim-desktop-pet.webp"
coverFit: "contain"
coverPosition: "center 18%"
coverBackground: "#06080d"
status: "ACTIVE DEVELOPMENT / ONGOING"
technologies: ["Python", "PyQt5", "qasync", "WebSocket", "Live2D", "PyOpenGL"]
linkUrl: "https://github.com/Mai-with-u/MaiM-desktop-pet"
linkLabel: "GitHub Repo"
linkType: "github"
align: "left"
---

What I cared about at the very beginning wasn't how much a desktop pet could do.

What really made me curious was this: if a character doesn't only live inside a chat window, but stays on the desktop for a long time, how should it appear?

Of course it can move, speak, and respond to the mouse. But the desktop isn't a stage prepared just for it. There are documents being written, web pages left open, files set down temporarily, and the things a person actually needs to get done each day.

If the character is too quiet, it's just a picture pasted on the screen. If it's too lively, it quickly becomes an interruption.

MaiM Desktop Pet started as my graduation project, and it was my first answer to this question.

## What I Wanted Was More Than a Floating Window

Putting a picture of a character on the desktop isn't hard.

Make a transparent window, keep it always above other apps, add dragging and a right-click menu, and you quickly get a program that "looks like a desktop pet."

But a window appearing doesn't mean the character really exists.

If its movements have nothing to do with its messages, and the user gets no response after clicking, then no matter how refined the artwork is, it ends up as just another layer of decoration on the desktop. It gets seen, but people can hardly find a reason to interact with it.

When MaiM stays on the desktop, I don't want the user to first open a full chat application or enter another page. When you want to talk to it, you can just call out to it. When you don't need it for a while, it stays off to the side and doesn't steal the work in progress.

So from the very beginning, this project was never just about "displaying a character." The window, the messages, the motions, and everyday operations all need to happen around the same character.

## Present, but Not Disturbing

The desktop is a very private, and very crowded, space.

An always-on-top window only needs to be a little bigger to cover buttons and text. One unnecessary popup can break a train of thought. The easier a desktop pet is to see, the more it needs to know restraint.

I kept the most direct operations for it: drag it to a suitable spot, call it back from the tray, or hide it at any time. Many of its abilities weren't laid out as a row of eye-catching buttons, but tucked into the right-click menu and bubbles, appearing only when needed.

Nor does the character's presentation need only one answer. A static image is quieter and asks less of the device. Live2D brings richer motion and gaze, but it shouldn't be a prerequisite for using this project. Users can choose based on their own desktop and habits, instead of being forced to accept a heavier form for the sake of showing off.

This kind of trade-off doesn't look like a "big feature," but it's very close to what using a desktop pet actually feels like.

It needs a sense of presence, and it also needs to leave room for everything else.

## A Sense of Character Comes From One Small Response After Another

I don't think more motion makes a character more vivid.

What's easily felt is often very small changes: when the mouse passes by, the gaze follows. When there's no operation for a while, the character naturally returns to idle. After a click, the motion isn't played at random with no relation, but feels like a response to this specific touch.

These changes don't need to happen all the time.

If the character repeats the same set of motions every few seconds, it quickly turns from "alive" into a new kind of screen noise. So idle and random motions need intervals between them, and they shouldn't appear at the same rhythm every time. The head and gaze can't suddenly jump to another direction; the transitions need to look natural enough.

During development I slowly realized that a sense of character doesn't come only from the animation assets themselves.

It comes more from cause and effect: the user does something, and the character gives an appropriate reaction. A slight turn of the head sometimes reads more like a response than a gorgeous animation that appears for no reason.

## Bringing Chat Back to the Character

MaiM already had its own chat ability. What Desktop Pet wants to do is bring that communication from a separate chat interface back to the character's side.

When messages can only appear in another window, the character and the conversation are easily understood as two sets of features. One handles display, the other handles input and output. They happened to be put in the same program, but they aren't truly connected.

So I'd rather have messages appear right beside the character.

When the user sends a sentence, the waiting state, the reply received, and the text in the bubble should all connect with each other. The character doesn't need to suddenly open a whole panel, and the desktop doesn't need to become another social app. When the conversation ends, the interface can retreat, and only MaiM remains on the desktop.

Around this goal, features like screenshots, text recognition, and translation were gradually wired into the same set of operations. They aren't there to fill up the menu, but to let the character connect more with what's happening on the desktop.

Technology should step back here.

The user doesn't need to know what kind of connection a message travels through, or how many parts sit behind the window. As long as the character responds in time, naturally, after an action is sent, that's enough.

## Once the Features Piled Up, I Reorganized It First

The project's initial structure was very direct: get the window to appear first, then let messages send and receive, then bit by bit add character motions and other features.

This approach worked well early on. An idea could show results quickly, and it kept confirming for me what this project should actually look like.

But as features grew, the once-convenient code started to tangle. Changing window behavior could affect the bubbles. Replacing how the character is presented could touch messages and state. Continuing to attach new abilities behind old code is faster in the short term, but in the long term it makes every change something you tiptoe around.

So I spent a period of time reorganizing it.

How the character displays, how messages come in, how user actions are handled, and how records are saved were split into relatively independent parts. Static images and Live2D are no longer two unrelated implementations, and different chat sources no longer force the upper interface to understand them all over again.

This part of the work barely shows up in screenshots.

But it decides whether this project can keep growing. Good organization isn't about making the architecture diagram look more complete. It's about not having to fear breaking the parts that already work the next time a new idea arrives.

## After the Graduation Project Ended

By the time the thesis was done, the project could already display the character, hold real-time conversations, and had dragging, bubbles, tray, screenshots, and two ways of presenting the character.

But it was still some distance from the natural desktop character in my mind.

The current settings still lean toward developers, requiring direct edits to configuration. The interface's sense of unity can still be polished. The usage guide and development docs haven't fully caught up with the project's changes. I once considered building voice interaction in as well, but in the end I didn't package a solution whose accuracy and latency were both unsatisfying as "finished."

These unfinished parts don't disappear automatically just because the graduation project was delivered.

On the contrary, they make what to do next clearer: make settings easier to understand, make the character's motions and messages more natural, let different devices choose suitable forms of presentation, and let people who want to join the project later not have to spend a long time guessing how it runs.

What I hope MaiM Desktop Pet is remembered for in the end isn't how many technologies it used, or how many features were stuffed into its menus.

It's that after opening the computer, there really is one more character on the desktop that responds.

It can keep you company off to the side, and it also knows when to quiet down.
