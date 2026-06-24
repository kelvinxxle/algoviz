# PRD: AlgoViz *(working title)*

## Overview

AlgoViz helps experienced self-taught and bootcamp developers finally *understand*
the meatier algorithms and data structures whose descendants they use every day but
never formally learned.

Rather than drilling practice problems or grading solutions, the product pairs a
**guided, narrated visualization** of each algorithm with a **sandbox the learner
drives with their own input**. It turns abstract pseudocode into something you can
watch, poke at, and build durable intuition for.

The goal is to help a working developer answer:

* What is this algorithm actually *doing*, step by step?
* Where do I already encounter this in real systems I use?
* *Why* does it work, what's the core insight?
* What does it cost, and why?
* Where do people get it wrong?

---

## Problem Statement

Self-taught and bootcamp developers can ship real software, but many never learned
the algorithms a CS degree drills. They hit walls like:

* "Use a trie for that." *(They've never seen one work.)*
* "That's basically Dijkstra." *(They can use a maps API but couldn't explain it.)*
* "Just put an LRU cache in front." *(They've configured one, never watched it evict.)*
* "A Bloom filter would save you the lookup." *(Sounds like magic, not a tool.)*

As a result:

* They use the *products* of these algorithms (databases, caches, routers, rate
  limiters) without understanding the machinery.
* Static textbook pseudocode doesn't build intuition. They memorize shapes, not ideas.
* They can't reason about tradeoffs, so they can't choose or adapt these tools confidently.
* The gap is invisible until it blocks them in a design discussion or a hard bug.

There is no focused tool that takes a working developer and makes these specific,
intermediate-to-advanced algorithms *click* by letting them see and manipulate them.

---

## Product Vision

Make invisible algorithms visible.

AlgoViz is a personal intuition-builder: a small, curated library where each algorithm
is something you **watch happen**, then **make your own** by feeding it your own input.
It closes a working developer's CS-fundamentals gaps the way a great whiteboard
explanation does, concretely and visually, one idea at a time.

The product does **not** drill interview problems or grade your code. It builds the
understanding that makes the rest of that work easier.

---

## Target Users

### Primary Users
* Self-taught developers with professional experience but no formal CS background
* Bootcamp graduates filling fundamentals gaps
* Working engineers who can code well but want to genuinely understand the algorithms
  beneath the tools they use

### Secondary Users
* Bootcamp and course instructors looking for a teaching aid
* CS students supplementing a textbook with something interactive

---

## Core Product Principles

**1. Show, then let me drive.**
Every topic opens with a guided walkthrough on a curated example, then hands the learner
a sandbox to run it on their own input. Watching builds the model; driving cements it.

**2. Visible over abstract.**
If a step can't be *shown*, it doesn't belong in the walkthrough. The animation is the
teacher; text is the supporting detail.

**3. Intuition over completeness.**
The aim is "now I get *why* this works," not exhaustive academic rigor or every edge case.

**4. Ground it in reality.**
Each topic names where the learner already encounters it in real systems, so the
abstract idea attaches to something they've touched.

**5. Depth on demand, one focus at a time.**
A clean surface showing a single algorithm in motion; supporting detail (complexity,
pitfalls, explanations) is reachable but never clutters the view.

---

## Core Features

### Topic Library *(flat and browsable)*
A curated set of about 10 algorithm/topic pages. The learner jumps freely to any topic,
with no prescribed order and no gating. (Deliberately no accounts, no progress, no progression.)

**v1 catalog (locked):**

| # | Topic | Flavor | Gap it fills |
|---|-------|--------|--------------|
| 1 | Dynamic Programming | canonical | Overlapping subproblems made visible |
| 2 | Dijkstra's Shortest Path | canonical | Weighted graphs, the priority-queue frontier |
| 3 | Union-Find | canonical | Near-O(1) connectivity; path compression |
| 4 | Backtracking | canonical | Systematic search and pruning; the recursion tree |
| 5 | Tries | canonical | Prefix trees behind autocomplete |
| 6 | Bloom Filters | systems | Probabilistic membership: "definitely no / maybe yes" |
| 7 | Consistent Hashing | systems | How distributed caches/shards avoid reshuffling |
| 8 | LRU Cache | systems | The eviction policy you configured but never *saw* |
| 9 | B-Trees | systems | The structure under every DB index and filesystem |
| 10 | Rate Limiting (token bucket / sliding window) | systems | The algorithm gating every API you call |

### Topic Page *(anatomy, locked)*
Each topic contains:

* **What it is.** Plain-language description.
* **Where you'll hit it in real code.** Why it matters; the systems it powers.
* **The visualization.** Guided walkthrough on a curated example, then run it on your
  own input. *(The star of the page.)*
* **Why it works.** The core insight that makes it correct and efficient.
* **Complexity.** Time and space, and *why*.
* **Common pitfalls.** Where people get it wrong.
* **AI explainer.** See below.

### Guided Walkthrough, then Custom Input
The core interaction. A narrated, step-by-step animation on a hand-picked example, then
a sandbox where the learner supplies their own input and steps or scrubs through it.
Show first, then make it yours.

### AI Explainer
A focused, context-aware assistant scoped to the **current topic and step**. It answers
questions like "why did it move the pointer there?" or "when would I actually reach for
this?" at the level of a working developer. Purpose: let the learner resolve confusion
in the moment without leaving the page.

---

## Future Features *(Not Required for Initial Release)*

* **Progress and accounts.** Saved state, "topics you've explored." *(Explicitly out of v1.)*
* **Spaced-repetition refreshers.** Resurface a topic to reinforce it over time.
* **"Implement it yourself" challenges.** Code the algorithm, watch your version run.
* **Expanded catalog.** More advanced/specialist topics (segment trees, max-flow, and
  similar) and the deferred interview-pattern set.
* **Community-contributed topics.** Let others author new visualizations.

---

## Success Metrics

### Learning Outcomes
* Users can explain, in their own words, *why* a given algorithm works.
* Users can describe where they'd encounter or use it in real systems.
* Users report a specific "now it clicks" moment for topics that previously felt opaque.

### Engagement Outcomes
* Users run the sandbox with their **own** input, not just the curated walkthrough.
* Users explore multiple topics in a session.
* Users invoke the AI explainer to resolve in-the-moment confusion.

---

## Non-Goals

AlgoViz is **not**:

* A practice or problem-grinding engine (no LeetCode-style problem sets).
* A code grader or solution checker.
* An interview-prep product (different framing, deliberately dropped).
* A progress-tracking, accounts, or gamified-progression system.
* A comprehensive algorithms encyclopedia. It's a curated set of about 10, done excellently.
* An introductory "data structures 101" course (arrays, basic linked lists, and the like
  are assumed known).
* A replacement for textbooks, courses, or mentors. It amplifies them.

The product's purpose is to make a specific set of intermediate-to-advanced algorithms
*click* for developers who can already code but never formally learned them.
