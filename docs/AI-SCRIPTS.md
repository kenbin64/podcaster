# Writing scripts with AI

You can write every script by hand, but the studio can also draft one for you, rewrite a scene, or help any chatbot write in the cue format. The studio's own AI runs on your computer, so your scripts never leave it.

## The studio's own AI (local, private)

The studio talks to [Ollama](https://ollama.com), which runs AI models on your own machine.

1. Install Ollama, then run `ollama pull llama3.2` once.
2. Start the studio. The Setup window finds Ollama and lets you pick a model; **⚙ Setup** reopens it later.

If Ollama is not running, the studio says so plainly, and you can still write or import scripts by hand.

### Draft a script: ✨ AI write

In **📝 Script & Prompter**:

1. In the brief field ("What you want in it…"), describe the topic and what to cover.
2. Optionally open **Brief** and add **The point** (what viewers should walk away with) and **Assets to weave in** (the file names of pictures you have ready).
3. Press **✨ AI write**.

The AI writes a complete script in the cue format and replaces the script box. Review it before you record: check that every file name matches an asset, and that each cue sits right before its word.

### Turn your notes into a script: ✨ Hybrid

Type rough notes into the script box, then press **✨ Hybrid**. The AI keeps your ideas and wording where it can, and adds the cues, sections and notes.

### Change a scene: Talk to the Director

In **🎬 Director & Scenes**, type into "Tell the Director…" and press Enter:

- `scene 3: new wording here` replaces scene 3 exactly. This works offline.
- `replace old words with new words` changes every match. This also works offline.
- Anything else, such as `make this punchier` or `warmer`, asks the AI to rewrite the current scene.

## Any chatbot

`AI-DIRECTIVE.md` in this repository is a complete brief for writing in the studio's cue format. Paste it into ChatGPT, Claude, Gemini or another chatbot, then ask for your episode. Save the result as `your-episode.cuescript.txt` in a folder with your pictures, and load the folder.

## Whatever writes it, you check it

AI drafts are a starting point. Before you record:

1. Read it aloud once. Cut anything you would not say.
2. Check that every file name matches an asset. Missing files show in red in the script view.
3. Check that each cue sits right before its word.
