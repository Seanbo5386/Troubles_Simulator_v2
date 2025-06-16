import { StoryManager } from './StoryManager.js';
import { UIRenderer } from './UIRenderer.js';
import { AudioManager } from './AudioManager.js';
import { SaveManager } from './SaveManager.js';
import { EventManager } from './EventManager.js';
import { StatsManager } from './StatsManager.js';

export class GameEngine {
    constructor(gameData) {
        this.gameData = gameData;
        this.state = 'initializing'; // initializing, menu, playing, paused, ended
        
        // Initialize managers
        this.storyManager = new StoryManager(gameData.storyGraph);
        this.uiRenderer = new UIRenderer();
        this.audioManager = new AudioManager();
        this.saveManager = new SaveManager();
        this.eventManager = new EventManager(gameData.events);
        this.statsManager = new StatsManager();
        
        // Game state
        this.currentPlayer = null;
        this.currentLocation = null;
        this.gameStats = {
            choicesMade: 0,
            locationsVisited: new Set(),
            npcsMet: new Set(),
            eventsWitnessed: new Set(),
            startTime: null,
            endTime: null
        };
        
        this.activeDialogue = null;
        this.lastSaveTime = null;
        
        // Bind methods
        this.onChoiceSelected = this.onChoiceSelected.bind(this);
        this.onLocationChange = this.onLocationChange.bind(this);
        this.onGameEnd = this.onGameEnd.bind(this);
    }

    async init() {
        try {
            console.log('Initializing game engine...');
            
            // Initialize all managers
            await this.uiRenderer.init();
            await this.audioManager.init();
            await this.saveManager.init();
            
            // Connect audio manager to UI renderer
            this.uiRenderer.setAudioManager(this.audioManager);
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Initialize UI
            this.uiRenderer.showIntroduction(this.gameData.storyGraph.nodes.intro);
            
            this.state = 'menu';
            console.log('Game engine initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize game engine:', error);
            throw error;
        }
    }

    setupEventListeners() {
        // Choice selection
        document.addEventListener('choiceSelected', (e) => {
            this.onChoiceSelected(e.detail);
        });

        // Location changes
        document.addEventListener('locationChanged', (e) => {
            this.onLocationChange(e.detail);
        });

        // Game control buttons
        document.getElementById('save-btn').addEventListener('click', () => {
            this.saveGame();
        });

        document.getElementById('load-btn').addEventListener('click', () => {
            this.loadGame();
        });

        document.getElementById('restart-btn').addEventListener('click', () => {
            this.restartGame();
        });

        document.getElementById('settings-btn').addEventListener('click', () => {
            this.uiRenderer.showSettings();
        });

        // Settings modal
        document.getElementById('close-settings').addEventListener('click', () => {
            this.uiRenderer.hideSettings();
        });

        // Volume controls
        document.getElementById('master-volume').addEventListener('input', (e) => {
            this.audioManager.setMasterVolume(e.target.value / 100);
        });

        document.getElementById('ambient-volume').addEventListener('input', (e) => {
            this.audioManager.setAmbientVolume(e.target.value / 100);
        });

        // Text speed
        document.getElementById('text-speed').addEventListener('change', (e) => {
            this.uiRenderer.setTextSpeed(e.target.value);
        });

        // Accessibility mode
        document.getElementById('accessibility-mode').addEventListener('change', (e) => {
            this.toggleAccessibilityMode(e.target.checked);
        });

        // End game modal
        document.getElementById('play-again').addEventListener('click', () => {
            this.restartGame();
        });

        document.getElementById('view-journal').addEventListener('click', () => {
            this.uiRenderer.showJournal();
        });
    }

    startGame(characterId) {
        console.log(`Starting game with character: ${characterId}`);

        // Begin statistics session
        this.statsManager.startSession(characterId);
        
        // Initialize player
        const characterData = this.gameData.characters[characterId];
        if (!characterData) {
            throw new Error(`Character ${characterId} not found`);
        }

        this.currentPlayer = {
            id: characterId,
            name: characterData.name,
            description: characterData.description,
            background: characterData.background,
            location: characterData.startLocation,
            stats: { ...characterData.startingStats },
            inventory: [...characterData.startingInventory],
            factionReputation: { ...characterData.factionReputation },
            flags: {},
            dialogueHistory: [],
            journal: []
        };

        // Initialize location
        this.currentLocation = this.gameData.locations[this.currentPlayer.location];
        
        // Set up initial state
        this.state = 'playing';
        this.gameStats.startTime = Date.now();
        this.gameStats.locationsVisited.add(this.currentPlayer.location);
        this.statsManager.visitLocation(this.currentPlayer.location);
        
        // Enable save button
        document.getElementById('save-btn').disabled = false;
        
        // Start background music
        this.audioManager.playAmbientSound(this.currentLocation.ambientSound);
        
        // Render initial location
        this.uiRenderer.renderLocation(this.currentLocation, this.currentPlayer);
        this.uiRenderer.updatePlayerStats(this.currentPlayer);
        this.uiRenderer.updateGameStats(this.gameStats);
        
        // Check for initial events
        this.checkForRandomEvents();
        
        console.log('Game started successfully');
    }

    async onChoiceSelected(detail) {
        console.log('Choice selected:', detail);

        const choice = detail.choice || detail;
        const context = detail.context || 'story';
        
        // Handle menu interactions before gameplay starts
        if (this.state === 'menu') {
            if (choice.characterId) {
                this.startGame(choice.characterId);
                return;
            }

            if (choice.nextNode) {
                await this.processStoryNode(choice.nextNode);
            }

            return;
        }

        if (this.state !== 'playing') return;

        // Increment choice counter
        this.gameStats.choicesMade++;

        if (context === 'event') {
            this.statsManager.recordChoice(choice);

            const result = this.eventManager.processEventChoice(choice, this.currentPlayer);
            if (result && result.consequence) {
                await this.uiRenderer.renderText(
                    result.consequence,
                    this.uiRenderer.elements.output,
                    { append: true }
                );
            }
        } else {
            // Apply choice effects for regular story choices
            if (choice.effects) {
                this.applyEffects(choice.effects);
            }
        }
        
        // Add to journal
        this.addJournalEntry(choice.text, 'choice');
        
        // Handle different choice types
        if (choice.nextNode) {
            await this.processStoryNode(choice.nextNode);
        } else if (choice.action) {
            await this.processAction(choice.action, choice.target);
        } else if (choice.dialogue) {
            await this.startDialogue(choice.dialogue);
        }
        
        // Update UI
        this.uiRenderer.updatePlayerStats(this.currentPlayer);
        this.uiRenderer.updateGameStats(this.gameStats);
        
        // Check for game state changes
        this.checkGameState();
        
        // Check for events
        this.checkForRandomEvents();
    }

    async processStoryNode(nodeId) {
        const node = this.gameData.storyGraph.nodes[nodeId];
        if (!node) {
            console.error(`Story node ${nodeId} not found`);
            return;
        }

        switch (node.type) {
            case 'story':
                this.uiRenderer.renderStoryNode(node);
                break;
            case 'character_selection':
                this.uiRenderer.renderCharacterSelection(node, this.gameData.characters);
                break;
            case 'location_hub':
                this.renderLocationHub();
                break;
            case 'ending':
                this.endGame(node);
                break;
            default:
                console.warn(`Unknown node type: ${node.type}`);
        }
    }

    async processAction(action, target) {
        switch (action) {
            case 'move':
                await this.moveToLocation(target);
                break;
            case 'talk':
                await this.startDialogue(target);
                break;
            case 'search':
                await this.searchLocation();
                break;
            case 'use_item':
                await this.useItem(target);
                break;
            case 'rest':
                await this.rest();
                break;
            default:
                console.warn(`Unknown action: ${action}`);
        }
    }

    async moveToLocation(locationId) {
        const location = this.gameData.locations[locationId];
        if (!location) {
            console.error(`Location ${locationId} not found`);
            return;
        }

        // Check if movement is allowed
        const currentLocation = this.gameData.locations[this.currentPlayer.location];
        if (!currentLocation.connections.includes(locationId)) {
            this.uiRenderer.showNotification('You cannot reach that location from here.', 'warning');
            return;
        }

        // Apply movement effects
        this.applyEffects({ tension: 1 });
        
        // Update location
        this.currentPlayer.location = locationId;
        this.currentLocation = location;
        this.gameStats.locationsVisited.add(locationId);
        this.statsManager.visitLocation(locationId);
        
        // Add journal entry
        this.addJournalEntry(`Traveled to ${location.name}`, 'location');
        
        // Change ambient sound
        this.audioManager.playAmbientSound(location.ambientSound);
        
        // Render new location
        this.uiRenderer.renderLocation(location, this.currentPlayer);
        
        // Trigger location changed event
        document.dispatchEvent(new CustomEvent('locationChanged', {
            detail: { locationId, location }
        }));
    }

    async startDialogue(npcId) {
        const npcData = this.gameData.dialogueTrees.npcs[npcId];
        if (!npcData) {
            console.error(`NPC ${npcId} not found`);
            return;
        }

        this.activeDialogue = {
            npcId,
            npcData,
            currentNode: 'initial'
        };

        this.gameStats.npcsMet.add(npcId);
        this.statsManager.meetNPC(npcId);
        this.addJournalEntry(`Spoke with ${npcData.name}`, 'interaction');
        
        this.uiRenderer.renderDialogue(this.activeDialogue);
    }

    async searchLocation() {
        const location = this.currentLocation;
        if (!location.searchable) {
            this.uiRenderer.showNotification('There is nothing to search here.', 'info');
            return;
        }

        // Apply search effects
        this.applyEffects({ tension: 2 });
        
        // Random search results
        const roll = Math.random();
        let result;
        
        if (roll < 0.2) {
            // Find item
            const items = Object.keys(this.gameData.items);
            const foundItem = items[Math.floor(Math.random() * items.length)];
            this.currentPlayer.inventory.push(foundItem);
            result = `You found a ${this.gameData.items[foundItem].name}!`;
            this.addJournalEntry(`Found ${this.gameData.items[foundItem].name}`, 'discovery');
        } else if (roll < 0.4) {
            // Increase suspicion
            this.applyEffects({ 
                factionReputation: { british_army: -1 },
                tension: 3
            });
            result = 'Your searching attracts unwanted attention from security forces.';
        } else {
            result = 'You search the area but find nothing of interest.';
        }
        
        this.uiRenderer.showNotification(result, 'info');
    }

    async useItem(itemId) {
        if (!this.currentPlayer.inventory.includes(itemId)) {
            this.uiRenderer.showNotification('You do not have that item.', 'warning');
            return;
        }

        const item = this.gameData.items[itemId];
        if (!item || !item.usable) {
            this.uiRenderer.showNotification('That item cannot be used.', 'warning');
            return;
        }

        // Apply item effects
        this.applyEffects(item.effects);
        
        // Remove item if consumable
        if (item.consumable) {
            this.currentPlayer.inventory = this.currentPlayer.inventory.filter(i => i !== itemId);
        }
        
        this.addJournalEntry(`Used ${item.name}`, 'action');
        this.uiRenderer.showNotification(`You used ${item.name}.`, 'success');
    }

    async rest() {
        this.applyEffects({
            tension: -3,
            morale: 2
        });
        
        this.addJournalEntry('Took time to rest and recover', 'action');
        this.uiRenderer.showNotification('You feel somewhat better after resting.', 'success');
    }

    applyEffects(effects) {
        if (!effects) return;

        // Apply stat changes
        Object.keys(effects).forEach(key => {
            if (key === 'factionReputation') {
                Object.keys(effects[key]).forEach(faction => {
                    if (this.currentPlayer.factionReputation[faction] !== undefined) {
                        this.currentPlayer.factionReputation[faction] += effects[key][faction];
                    }
                });
            } else if (this.currentPlayer.stats[key] !== undefined) {
                this.currentPlayer.stats[key] += effects[key];
                
                // Clamp values
                if (key === 'tension') {
                    this.currentPlayer.stats[key] = Math.max(0, Math.min(100, this.currentPlayer.stats[key]));
                } else if (key === 'morale') {
                    this.currentPlayer.stats[key] = Math.max(0, Math.min(100, this.currentPlayer.stats[key]));
                } else if (key === 'ptsd') {
                    this.currentPlayer.stats[key] = Math.max(0, Math.min(100, this.currentPlayer.stats[key]));
                }
            }
        });
    }

    checkGameState() {
        // Check for game over conditions
        if (this.currentPlayer.stats.tension >= 100) {
            this.endGame(this.gameData.storyGraph.nodes.ending_exile);
            return;
        }
        
        if (this.currentPlayer.stats.morale <= 0) {
            this.endGame(this.gameData.storyGraph.nodes.ending_martyr);
            return;
        }
        
        if (this.currentPlayer.stats.ptsd >= 100) {
            this.endGame(this.gameData.storyGraph.nodes.ending_exile);
            return;
        }
        
        // Check for faction reputation extremes
        Object.keys(this.currentPlayer.factionReputation).forEach(faction => {
            if (this.currentPlayer.factionReputation[faction] <= -10) {
                this.endGame(this.gameData.storyGraph.nodes.ending_martyr);
                return;
            }
        });
    }

    checkForRandomEvents() {
        if (this.eventManager.activeEvent) return;

        if (Math.random() < 0.3) { // 30% chance
            const availableEvents = this.eventManager.getAvailableEvents(
                this.currentPlayer.location,
                this.currentPlayer,
                this.gameStats
            );

            if (availableEvents.length > 0) {
                const event = availableEvents[Math.floor(Math.random() * availableEvents.length)];
                this.triggerEvent(event);
            }
        }
    }

    triggerEvent(eventData) {
        const event = this.eventManager.triggerEvent(
            eventData,
            this.currentPlayer,
            this.gameStats
        );

        this.gameStats.eventsWitnessed.add(event.id);
        this.statsManager.witnessEvent(event.id, event.category);
        this.addJournalEntry(`Witnessed: ${event.title}`, 'event');
        this.uiRenderer.renderEvent(event);
    }

    renderLocationHub() {
        const location = this.currentLocation;
        const availableActions = this.getAvailableActions();
        
        this.uiRenderer.renderLocationHub(location, availableActions, this.currentPlayer);
    }

    getAvailableActions() {
        const actions = [];
        const location = this.currentLocation;
        
        // Movement actions
        location.connections.forEach(connectionId => {
            const connectedLocation = this.gameData.locations[connectionId];
            if (connectedLocation) {
                actions.push({
                    type: 'move',
                    text: `Go to ${connectedLocation.name}`,
                    target: connectionId,
                    action: 'move'
                });
            }
        });
        
        // NPC interactions
        if (location.npcs) {
            location.npcs.forEach(npcId => {
                const npc = this.gameData.dialogueTrees.npcs[npcId];
                if (npc) {
                    actions.push({
                        type: 'talk',
                        text: `Talk to ${npc.name}`,
                        target: npcId,
                        action: 'talk'
                    });
                }
            });
        }
        
        // Search action
        if (location.searchable) {
            actions.push({
                type: 'search',
                text: 'Search the area',
                action: 'search'
            });
        }
        
        // Item usage
        this.currentPlayer.inventory.forEach(itemId => {
            const item = this.gameData.items[itemId];
            if (item && item.usable) {
                actions.push({
                    type: 'use_item',
                    text: `Use ${item.name}`,
                    target: itemId,
                    action: 'use_item'
                });
            }
        });
        
        // Rest action
        actions.push({
            type: 'rest',
            text: 'Rest and recover',
            action: 'rest'
        });
        
        return actions;
    }

    addJournalEntry(objectiveText, type = 'general') {
        const { ptsd = 0, tension = 0, morale = 100 } = this.currentPlayer?.stats || {};

        let subjectiveText = objectiveText;

        if (tension > 70) {
            const words = objectiveText.replace(/[.!?]/g, '').split(/\s+/);
            subjectiveText = words.map(w => `${w}.`).join(' ');
            subjectiveText += ' Can\'t think.';
        }

        if (ptsd > 50) {
            const blurPhrases = ["...it's all a blur.", "...the sounds won't stop."];
            subjectiveText += ' ' + blurPhrases[Math.floor(Math.random() * blurPhrases.length)];
        }

        if (morale < 30) {
            subjectiveText += " Another day, another tragedy. What's the point?";
        }

        const entry = {
            id: Date.now() + Math.random(),
            text: subjectiveText,
            objectiveText,
            type,
            timestamp: Date.now(),
            location: this.currentPlayer.location
        };

        this.currentPlayer.journal.push(entry);
        this.uiRenderer.addJournalEntry(entry);
    }

    endGame(endingNode) {
        this.state = 'ended';
        this.gameStats.endTime = Date.now();

        // Finalize statistics session
        this.statsManager.endSession(endingNode.endingType);
        const sessionStats = this.statsManager.getSessionStatistics();

        // Disable save button
        document.getElementById('save-btn').disabled = true;
        
        // Stop ambient audio
        this.audioManager.stopAmbientSound();
        
        // Show ending
        this.uiRenderer.showEnding(endingNode, this.currentPlayer, sessionStats);
    }

    saveGame() {
        const saveData = {
            player: this.currentPlayer,
            gameStats: {
                ...this.gameStats,
                locationsVisited: Array.from(this.gameStats.locationsVisited),
                npcsMet: Array.from(this.gameStats.npcsMet),
                eventsWitnessed: Array.from(this.gameStats.eventsWitnessed)
            },
            timestamp: Date.now()
        };
        
        this.saveManager.save(saveData);
        this.lastSaveTime = Date.now();
        this.uiRenderer.showNotification('Game saved successfully!', 'success');
    }

    loadGame() {
        const saveData = this.saveManager.load();
        if (!saveData) {
            this.uiRenderer.showNotification('No save data found.', 'warning');
            return;
        }
        
        try {
            // Restore player state
            this.currentPlayer = saveData.player;
            this.currentLocation = this.gameData.locations[this.currentPlayer.location];
            
            // Restore game stats
            this.gameStats = {
                ...saveData.gameStats,
                locationsVisited: new Set(saveData.gameStats.locationsVisited),
                npcsMet: new Set(saveData.gameStats.npcsMet),
                eventsWitnessed: new Set(saveData.gameStats.eventsWitnessed)
            };
            
            // Update game state
            this.state = 'playing';
            document.getElementById('save-btn').disabled = false;
            
            // Update UI
            this.uiRenderer.renderLocation(this.currentLocation, this.currentPlayer);
            this.uiRenderer.updatePlayerStats(this.currentPlayer);
            this.uiRenderer.updateGameStats(this.gameStats);
            
            // Resume audio
            this.audioManager.playAmbientSound(this.currentLocation.ambientSound);
            
            this.uiRenderer.showNotification('Game loaded successfully!', 'success');
            
        } catch (error) {
            console.error('Failed to load game:', error);
            this.uiRenderer.showNotification('Failed to load game data.', 'error');
        }
    }

    restartGame() {
        if (confirm('Are you sure you want to restart? All progress will be lost.')) {
            // Reset all state
            this.currentPlayer = null;
            this.currentLocation = null;
            this.gameStats = {
                choicesMade: 0,
                locationsVisited: new Set(),
                npcsMet: new Set(),
                eventsWitnessed: new Set(),
                startTime: null,
                endTime: null
            };
            
            this.state = 'menu';
            this.activeDialogue = null;
            
            // Reset UI
            this.uiRenderer.reset();
            this.uiRenderer.showIntroduction(this.gameData.storyGraph.nodes.intro);
            
            // Stop audio
            this.audioManager.stopAll();
            
            // Disable save button
            document.getElementById('save-btn').disabled = true;
        }
    }

    toggleAccessibilityMode(enabled) {
        if (enabled) {
            document.body.classList.add('accessibility-mode');
        } else {
            document.body.classList.remove('accessibility-mode');
        }
    }

    hasUnsavedProgress() {
        return this.state === 'playing' && 
               this.currentPlayer && 
               (!this.lastSaveTime || Date.now() - this.lastSaveTime > 300000); // 5 minutes
    }

    onLocationChange(detail) {
        // Handle location-specific logic
        console.log(`Location changed to: ${detail.locationId}`);
    }

    onGameEnd(detail) {
        console.log('Game ended:', detail);
    }
}