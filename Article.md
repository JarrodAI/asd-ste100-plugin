You ask your AI agent a simple question. You get back four paragraphs.

The first paragraph thanks you for the question. The second paragraph explains what the agent is about to explain. The third paragraph contains the answer, somewhere in the middle, wrapped in "it's worth noting" and "that said." The fourth paragraph apologizes for anything it might have missed.

Somewhere inside that wall of text is a sentence that matters. Maybe it says the build is broken. Maybe it says a file is gone. You will find it only if you read every line, and you did not come here to read. You came here to supervise.

That is the real job now. For many of us, the work is no longer typing code. The work is reading what the model says it did, deciding if that is right, and saying "yes" or "no." Reading is the bottleneck.

On October 2, 2026, Andrej Karpathy posted about exactly this bottleneck. His answer was surprising: make the model write like an **aircraft maintenance manual**.

This article explains what he suggested, why it works, and how I turned it into a plugin that installs into Claude Code, Codex, OpenCode, GitHub Copilot, VS Code, Antigravity, and Kiro.

## What is ASD-STE100?

Aircraft maintenance is a bad place for confusing writing. A mechanic who misreads one sentence can leave a bolt loose. Many of those mechanics do not speak English as a first language.

So, in the 1980s, the European aerospace industry built a rulebook for writing maintenance documents. Today it is called **ASD-STE100 Simplified Technical English** (STE), and it is maintained by ASD, the AeroSpace and Defence Industries Association of Europe. It is an international standard for controlled natural language, created to make aerospace and defense maintenance documentation clear and unambiguous.

The rules are strict and surprisingly easy to explain:

- **Short sentences.** A procedure sentence has 20 words or fewer. A descriptive sentence has 25 words or fewer.
- **One action per instruction.** "Remove the cover and disconnect the cable" becomes two steps.
- **Active voice.** "Tighten the bolt," not "The bolt should be tightened."
- **One word, one meaning.** The standard ships a dictionary of roughly 900 approved general words. Each word has one approved meaning and one part of speech.
- **No synonyms for variety.** If a part is a "bolt" on page one, it is a "bolt" on page 400. It is never a "fastener," a "screw," or a "securing element." Writers do not get to be creative.
- **Warnings first.** The warning comes before the step it applies to, not after.

Read that list again as a person who must supervise an AI. Every rule fixes something that annoys you in model output.

## What Karpathy actually said

Karpathy said he had success asking language models to explain things in ASD-STE100. He said the heavy constraints on clean writing style produce text that is, in his words, "a lot more readable."

He also gave a practical tip. The standard is quite stringent, so he sometimes asks for output **"80% of the way to ASD-STE100"** instead of the full standard. Models know the standard well, so a short request is enough.

The bigger idea was about where human work is going. He argued that people will spend much more time trying to understand what language models produce, and that "a lot more of our work will rise up the abstractions into oversight and understanding."

He did not stop at text. He described a ladder of output formats, each one easier on the human reader:

1. **Controlled English** (ASD-STE100)
2. **Diagrams**, because a picture is often faster to take in than a paragraph
3. **HTML pages**, for things you can click through and explore
4. **Explainer videos**, in the style of 3Blue1Brown, with an AI voice

The first rung is the cheapest. It needs no tools, no rendering, and no extra tokens. It needs one instruction: *write like this.* That is the rung I decided to build.

## The problem with "just paste it into the chat"

You can type "answer in ASD-STE100" at the start of a conversation. It works. For about ten minutes.

Then the context grows. The model drifts. The sentences get longer. The polite filler comes back. The "bolt" becomes a "fastener" and then a "securing component." You paste the instruction again. Tomorrow you start a new session and you paste it again.

This is a job for a plugin. A plugin loads the rules at the start of every session, with no copy and paste. That is how tools like Ponytail (a plugin that forces AI agents toward the simplest code) work, and it is the model I copied: one rules file, loaded automatically, installed with one command.

## What the plugin does

The plugin is called **asd-ste100-plugin**. It puts one rules file in front of the model at the start of every session. The model then writes all prose to you in controlled English.

The rules are tuned for a supervisor, not for a maintenance technician. These are the rules inside the file:

- Short, direct sentences. One idea in each sentence.
- The key result goes in the first line.
- One action in each procedure step. Steps are numbered.
- **One term for one object.** The model never swaps a word for variety.
- No polite filler, no apology, no recap.
- A warning comes before the step it applies to.

Two rules solve problems that the aircraft standard never had to solve, because aircraft manuals are not written by a chatty AI.

**Every question starts with "Question:".** Models often hide a question inside a long sentence, and you do not notice that they are waiting for you. Now a question is always labeled, so you can find it in one glance.

**Every observation has a severity.** Models are good at saying "I noticed something concerning." They are bad at saying how concerning. The result is that you panic about a style nit, or you skim past a real problem. The plugin forces this format:

1. What the model saw. Facts only.
2. Severity: low, medium, or high.
3. Recommended action.

"High" is reserved for three cases: work stops, data is lost, or security is at risk. If a risk is only possible, the model must say what has to be true for the risk to happen. This one rule removes most of the false alarms.

Here is the difference. This example is illustrative, not a recorded log.

**Before:**

> I noticed that there might potentially be a problem with how the config is being loaded, which could possibly cause some issues down the line, so it may be worth taking a look when you get a chance.

**After:**

> Result: The config file does not load.
> Severity: medium.
> Cause: The path conf/app.json does not exist.
> Action: Create the file, or change the path.

Same information. The second one takes four seconds to read, and you know what to do.

## One rules file, seven doors

Every AI coding tool has its own way to load instructions. I did not want seven copies of the rules that drift apart, so there is one source: `skills/asd-ste100/SKILL.md`. A small script copies it to the formats each tool expects, and a test fails if any copy is out of date.

- **Claude Code:** a plugin with a session-start hook.
- **Codex:** a plugin with the same hook.
- **GitHub Copilot CLI:** a plugin.
- **OpenCode:** a plugin that adds the rules to the system prompt.
- **Antigravity CLI and IDE:** an extension, and an always-on rule file.
- **Kiro IDE and CLI:** a steering file set to `inclusion: always`.
- **VS Code:** a `.github/copilot-instructions.md` file.
- **Anything that reads AGENTS.md:** one `npx` command.

I tested the Claude Code and Codex installs. The plugin loaded, the hook ran, and the answers came back in short numbered steps. The Claude Code manifest passes the official validator. I could not test every tool, because some need a live account or are not on my machine, and I say so in the README.

## What this plugin is not

I want to be honest about the limits, because the standard's own maintainers are.

The plugin is a **style instruction**, not a certified STE checker. It does not ship the full approved dictionary and it does not scan the model's output against it. A model told to write like STE will often *look* like STE without following every rule. The ASD-STE100 maintainers have said that no tool can replace a trained human writer and expert review.

Also, **readable is not the same as correct.** A sentence can be short, clear, and wrong. The plugin makes it faster to read the model's claims. It does not make the claims true. You still verify.

And it applies to prose only. Code, commands, and file contents are left alone. It would be a bad idea to rewrite a function so it sounds like a maintenance manual.

This is close to what Karpathy described when he said "80% of the way." The goal is not a perfect standard. The goal is to take away the friction between the model's answer and your decision.

## Why I think this matters

When a human wrote every line, writing was the slow step. Now the model writes in seconds, and your attention is the scarce thing. Every wasted sentence costs you something.

Aviation solved a version of this problem forty years ago. They had people with little time, serious consequences for misunderstanding, and readers from many languages. They did not solve it with smarter readers. They solved it with stricter writers.

We now have writers that never get tired and follow a rulebook if we give them one. It is a small change, and it feels like a big one the first morning you read an agent's report and understand it on the first pass.

**The plugin is open source.** Install it, change the rules in the one file to suit you, and tell me what breaks.

https://github.com/JarrodAI/asd-ste100-plugin

## How to install it

Pick your tool. Each install takes about one minute. You need Node.js on your PATH, because the hooks run on Node.

### Claude Code

Send these as two separate prompts:

```
/plugin marketplace add JarrodAI/asd-ste100-plugin
```

```
/plugin install asd-ste100-plugin@asd-ste100-plugin
```

Start a new session. The rules load by themselves.

### Codex

```
codex plugin marketplace add JarrodAI/asd-ste100-plugin
codex plugin add asd-ste100-plugin@asd-ste100-plugin
```

Run `codex`, open `/hooks`, trust the session-start hook, and start a new thread.

### GitHub Copilot CLI

```
copilot plugin marketplace add JarrodAI/asd-ste100-plugin
copilot plugin install asd-ste100-plugin@asd-ste100-plugin
```

### OpenCode

```
git clone https://github.com/JarrodAI/asd-ste100-plugin
```

Then add the plugin file to `opencode.json`, with the absolute path to your clone:

```
{ "plugin": ["/absolute/path/to/asd-ste100-plugin/.opencode/plugins/asd-ste100.mjs"] }
```

### Antigravity

CLI:

```
agy plugin install https://github.com/JarrodAI/asd-ste100-plugin
```

IDE (run inside your project):

```
npx github:JarrodAI/asd-ste100-plugin antigravity
```

### Kiro (IDE and CLI)

Run inside your project:

```
npx github:JarrodAI/asd-ste100-plugin kiro
```

This writes a steering file with `inclusion: always`. A Kiro CLI custom agent also needs this line in its `resources` field:

```
"file://.kiro/steering/asd-ste100.md"
```

### VS Code

Run inside your project:

```
npx github:JarrodAI/asd-ste100-plugin vscode
```

### Anything else that reads AGENTS.md

```
npx github:JarrodAI/asd-ste100-plugin agents
```

The `npx` installer never overwrites a file you already have. It adds one marked block, and only once.

To stop the mode for a session, say "stop asd-ste100".

## Sources

- Search Engine Journal: Karpathy on making LLMs write like an aircraft manual: https://www.searchenginejournal.com/karpathy-llm-aircraft-manual-writing/591813/
- gu-log: Karpathy's output format ladder: https://gu-log.vercel.app/en/posts/en-mp-317-20261002-karpathy-llm-output-format-ladder/
- Wikipedia: Simplified Technical English: https://en.wikipedia.org/wiki/Simplified_Technical_English

*This plugin is an independent project. It is not affiliated with or endorsed by ASD, the ASD-STE100 maintainers, or Andrej Karpathy.*

=====================================================================
STOP COPYING HERE. EVERYTHING BELOW THIS LINE IS NOT PART OF THE ARTICLE.
=====================================================================

MEDIUM SETTINGS

Title (pick one):
1. I Made My AI Write Like an Aircraft Manual. Then I Built a Plugin So Yours Can Too.
2. Karpathy Wants AI to Write Like an Aircraft Manual. Here Is a Plugin That Does It.
3. Stop Reading AI Rambles: Make Your Agent Write in ASD-STE100

Subtitle:
One rules file. Seven AI coding tools. Short sentences, one action per step, and every question and warning labeled.

Tags (Medium allows 5):
1. Artificial Intelligence
2. Claude Code
3. Developer Tools
4. Technical Writing
5. Productivity

SEO description (under 160 characters):
A plugin makes Claude Code, Codex, OpenCode, Copilot, Kiro and Antigravity write in ASD-STE100, the aircraft manual standard that Karpathy suggested.

Keywords:
ASD-STE100, Simplified Technical English, Andrej Karpathy, controlled English, AI agent, Claude Code plugin, Codex plugin, OpenCode plugin, Kiro steering, Antigravity, GitHub Copilot, AGENTS.md, LLM output, readable AI

Cover image idea:
The ASCII art banner from the README, in a code-style screenshot on a dark background.

Before you post:
- Make the GitHub repository public. The install commands do not work while it is private.
- The article quotes Karpathy from two secondary write-ups, not from his original post. Check the quotes against his post.

=====================================================================

TWITTER / X THREAD (8 tweets)

1/
Your AI agent answers in 4 paragraphs. The one sentence that matters is buried in the middle.

Karpathy's fix: make it write like an aircraft maintenance manual.

I turned that into a plugin for Claude Code, Codex, OpenCode, Copilot, Kiro and more. 🧵

2/
The format is ASD-STE100, "Simplified Technical English."

Built for aircraft mechanics, where a misread sentence = a loose bolt.

Short sentences. One action per step. Active voice. One word, one meaning.

3/
Karpathy (Oct 2): the strict style gives text that is "a lot more readable."

His tip: ask for "80% of the way to ASD-STE100," because the full standard is stringent.

His bigger point: our work moves up into oversight and understanding. Reading is the bottleneck.

4/
Pasting "answer in ASD-STE100" into chat works for ten minutes. Then the model drifts. The filler comes back.

So I made it a plugin. The rules load at every session start. No copy and paste.

5/
Two rules I added that the aircraft standard never needed:

1. Every question starts with "Question:"
2. Every observation gets a severity: low / medium / high

"High" only if work stops, data is lost, or security is at risk. No more false alarms.

6/
Before:
"I noticed there might potentially be a problem with how the config is being loaded..."

After:
Result: config does not load.
Severity: medium.
Cause: path conf/app.json is missing.
Action: create the file.

7/
One rules file. Seven doors:
Claude Code, Codex, Copilot CLI, OpenCode, Antigravity, Kiro, VS Code.

Plugins where the tool has plugins. One npx command where it does not.

Claude Code:
/plugin marketplace add JarrodAI/asd-ste100-plugin
/plugin install asd-ste100-plugin@asd-ste100-plugin

8/
Honest limits: it is a style prompt, not a certified STE checker. No full dictionary. Short ≠ correct. You still verify.

Open source, MIT:
https://github.com/JarrodAI/asd-ste100-plugin

(Not affiliated with ASD or Karpathy.)

SINGLE TWEET VERSION

Karpathy says: ask AI to write like an aircraft manual (ASD-STE100). I built a plugin that does it every session: Claude Code, Codex, OpenCode, Copilot, Kiro, Antigravity, VS Code. Questions labeled. Severity on every warning. Open source: https://github.com/JarrodAI/asd-ste100-plugin

HASHTAGS FOR X (use 2 or 3)
#ClaudeCode #AIagents #DevTools #OpenCode #Codex #ASDSTE100

SUGGESTED FIRST REPLY TO YOUR OWN THREAD
Install in Claude Code takes two commands. Full steps for Codex, OpenCode, Kiro, VS Code and Antigravity are in the README and the article.
