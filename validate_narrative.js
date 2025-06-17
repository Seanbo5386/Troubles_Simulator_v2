const fs = require("fs");
const path = require("path");

function loadJSON(relPath) {
  const fullPath = path.join(__dirname, relPath);
  return JSON.parse(fs.readFileSync(fullPath, "utf8"));
}

function gatherEvents(data) {
  const categories = ["violentEvents", "moralDilemmas", "randomEncounters"];
  const result = [];
  for (const cat of categories) {
    if (Array.isArray(data[cat])) {
      result.push(...data[cat]);
    }
  }
  return result;
}

const eventsData = loadJSON("data/events.json");
const charactersData = loadJSON("data/characters.json");
const dialogueTreesData = loadJSON("data/dialogue-trees.json");
const storyGraph = loadJSON("data/story-graph.json");
const locationsData = loadJSON("data/locations.json");
const endingsData = loadJSON("data/endings.json");

const events = gatherEvents(eventsData);
const characters = Object.values(charactersData);

console.log("Narrative Validation Report for Troubles Simulator v2");
console.log("----------------------------------------------------\n");
console.log(
  `Scanning ${events.length} events and ${characters.length} characters...\n`,
);

const warnings = [];
const errors = [];

// ----- Contradictory Conditions -----
for (const event of events) {
  const cond = event.triggerConditions || {};
  for (const [key, value] of Object.entries(cond)) {
    if (key.startsWith("min")) {
      const root = key.slice(3);
      const maxKey = "max" + root;
      if (cond.hasOwnProperty(maxKey)) {
        const minVal = value;
        const maxVal = cond[maxKey];
        if (
          typeof minVal === "number" &&
          typeof maxVal === "number" &&
          minVal > maxVal
        ) {
          warnings.push(
            `Contradictory Condition in event '${event.id}': ` +
              `condition '${key}' (${minVal}) is greater than '${maxKey}' (${maxVal}).`,
          );
        }
      }
    }
  }
}

// Collect all starting inventory items
const startingItems = new Set();
for (const char of characters) {
  (char.startingInventory || []).forEach((it) => startingItems.add(it));
}

// Build set of valid story nodes (story graph + endings)
const validStoryNodes = new Set(Object.keys(storyGraph.nodes));
Object.keys(endingsData).forEach((id) => validStoryNodes.add(id));

// ----- Unreachable Events -----
for (const event of events) {
  const cond = event.triggerConditions || {};
  if (cond.characterId) {
    const exists = characters.some((c) => c.id === cond.characterId);
    if (!exists) {
      errors.push(
        `Unreachable Event '${event.id}': no character with id '${cond.characterId}'.`,
      );
    }
  }
}

// ----- Missing Requirements -----
for (const event of events) {
  (event.choices || []).forEach((choice) => {
    if (Array.isArray(choice.requirements) && choice.requirements.length > 0) {
      const missing = choice.requirements.filter(
        (req) => !startingItems.has(req),
      );
      if (missing.length > 0) {
        errors.push(
          `Missing Requirement in event '${event.id}' choice '${choice.text}': ` +
            `item(s) ${missing.join(", ")} not in any starting inventory.`,
        );
      }
    }
  });
}

// ----- NextNode Validity: Events -----
for (const event of events) {
  (event.choices || []).forEach((choice) => {
    if (choice.nextNode && !validStoryNodes.has(choice.nextNode)) {
      errors.push(
        `Invalid nextNode '${choice.nextNode}' in event '${event.id}'.`,
      );
    }
  });
}

// ----- Dialogue Tree Validation & Orphans -----
for (const [npcId, npc] of Object.entries(dialogueTreesData.npcs || {})) {
  const tree = npc.dialogueTree || {};
  const nodeIds = Object.keys(tree);
  const nodeSet = new Set(nodeIds);
  const referenced = new Set();

  for (const [nodeId, node] of Object.entries(tree)) {
    for (const choice of node.choices || []) {
      if (choice.nextNode) {
        if (!nodeSet.has(choice.nextNode) && !validStoryNodes.has(choice.nextNode)) {
          errors.push(
            `Invalid nextNode '${choice.nextNode}' in NPC '${npcId}' node '${nodeId}'.`,
          );
        } else {
          referenced.add(choice.nextNode);
        }
      }
    }
  }

  for (const nid of nodeIds) {
    if (nid !== "initial" && !referenced.has(nid)) {
      warnings.push(`Orphaned dialogue node '${npcId}:${nid}'`);
    }
  }
}

// ----- NPC References In Locations -----
for (const [locId, loc] of Object.entries(locationsData)) {
  (loc.npcs || []).forEach((npcId) => {
    if (!dialogueTreesData.npcs[npcId]) {
      errors.push(`Location '${locId}' references unknown NPC '${npcId}'.`);
    }
  });
}

const totalIssues = warnings.length + errors.length;

warnings.forEach((msg) => console.log(`[WARNING] ${msg}`));
errors.forEach((msg) => console.log(`[ERROR] ${msg}`));

console.log(
  `\n[INFO] Validation Complete. ${totalIssues} issue${totalIssues !== 1 ? "s" : ""} found.`,
);
