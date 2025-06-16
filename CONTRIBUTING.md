# Contributing to Troubles Simulator v2

## Introduction
Thank you for your interest in contributing to **Troubles Simulator v2**. We welcome community involvement in improving the game's narrative, code, translations, and documentation. Your contributions help us create a respectful and historically sensitive experience.

## Code of Conduct
This project adheres to a standard Code of Conduct. By participating, you agree to uphold a welcoming and harassment-free environment. See `CODE_OF_CONDUCT.md` for details.

## How to Contribute
### Reporting Bugs
- **Check existing issues** before opening a new one to avoid duplicates.
- Provide clear steps to reproduce the problem, including browser and OS information.
- Attach relevant logs or screenshots when possible.

### Suggesting Enhancements
- Describe the feature you would like to see and why it benefits players.
- Include examples of how it might work in game.
- Be respectful of the serious tone of the project when proposing new content.

### Your First Code Contribution
1. Fork and clone the repository.
2. Install Node.js 14 or later.
3. Run `npm install` if any dependencies are added in the future.
4. Start the game with `./start_server.sh` (or `start_server.bat` on Windows).
5. Create a new branch in your fork, commit your changes, and open a pull request.

## Style Guides
### Git Commit Messages
- Use the present tense: *"Fix bug"* not *"Fixed bug"*.
- Limit the subject line to 50 characters and follow with a blank line and a detailed explanation if needed.
- Reference related issues with `Fixes #123` or `Refs #123`.

### JavaScript Style Guide
- Write ES6+ code.
- Format source files with [Prettier](https://prettier.io/) before committing.

### Narrative Style Guide
The game's narrative data lives in JSON files inside `data/`:
- `events.json`
- `dialogue-trees.json`
- `story-graph.json`
- `characters.json`, `locations.json`, and `items.json`

Each file follows a consistent structure. For example, `dialogue-trees.json` stores NPC dialogues under `npcs`:
```json
"npc_id": {
  "name": "NPC Name",
  "description": "Short description",
  "dialogueTree": {
    "node_id": {
      "text": "What the NPC says",
      "choices": [
        {
          "text": "Player choice text",
          "nextNode": "another_node",
          "requirements": [],
          "effects": {
            "tension": 1,
            "morale": -2,
            "factionReputation": {"ira": 1}
          }
        }
      ]
    }
  }
}
```

To add a new choice to a dialogue node, include a `text` field for the player's option, a `nextNode` pointing to the resulting node, and an `effects` object describing stat or reputation changes. Effects can modify `tension`, `morale`, `ptsd`, or `factionReputation` values. Positive numbers increase stats, while negative numbers decrease them.

The overall tone of the game is **serious and historically respectful**. Content should never trivialize the real suffering associated with The Troubles. Keep dialogue measured and sensitive.

## Pull Request Process
1. Ensure your branch is up to date with `main`.
2. Open a pull request describing your changes and how they fit the project's tone and goals.
3. A maintainer will review your contribution for style, accuracy, and historical sensitivity.
4. Address any feedback with additional commits in the same branch.
5. Once approved, your pull request will be merged.

---
Thank you for helping improve *Troubles Simulator v2*!
