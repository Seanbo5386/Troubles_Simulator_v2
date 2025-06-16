import { i18n } from './i18n.js';

export class UIRenderer {
    constructor(audioManager = null) {
        this.elements = {};
        this.textSpeed = 'medium';
        this.isTyping = false;
        this.currentTypewriter = null;
        this.audioManager = audioManager;
        this.previousStats = { tension: 0, morale: 0, ptsd: 0 };
    }

    async init() {
        this.cacheElements();
        this.setupEventListeners();
        console.log('UI Renderer initialized');
    }

    cacheElements() {
        this.elements = {
            output: document.getElementById('output'),
            choicesContainer: document.getElementById('choices-container'),
            inputArea: document.getElementById('input-area'),
            promptInput: document.getElementById('prompt-input'),
            submitButton: document.getElementById('submit-button'),
            
            // Stats
            tensionLevel: document.getElementById('tension-level'),
            tensionBar: document.getElementById('tension-bar'),
            moraleLevel: document.getElementById('morale-level'),
            moraleBar: document.getElementById('morale-bar'),
            ptsdLevel: document.getElementById('ptsd-level'),
            ptsdBar: document.getElementById('ptsd-bar'),
            factionList: document.getElementById('faction-list'),
            
            // Inventory
            inventoryList: document.getElementById('inventory-list'),
            
            // Actions
            actionButtons: document.getElementById('action-buttons'),
            
            // Journal
            journalContent: document.getElementById('journal-content'),
            
            // Character info
            characterName: document.getElementById('character-name'),
            characterBackground: document.getElementById('character-background'),
            currentLocation: document.getElementById('current-location'),
            
            // Game stats
            choicesCount: document.getElementById('choices-count'),
            locationsCount: document.getElementById('locations-count'),
            npcsCount: document.getElementById('npcs-count'),
            eventsCount: document.getElementById('events-count'),
            
            // Background
            backgroundImage: document.getElementById('background-image'),
            
            // Modals
            settingsModal: document.getElementById('settings-modal'),
            endgameModal: document.getElementById('endgame-modal')
        };
    }

    setupEventListeners() {
        // Enter key in input
        this.elements.promptInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.handleTextInput();
            }
        });

        // Submit button
        this.elements.submitButton?.addEventListener('click', () => {
            this.handleTextInput();
        });

        // Close modals when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeAllModals();
            }
        });
    }

    handleTextInput() {
        const input = this.elements.promptInput.value.trim();
        if (!input) return;

        this.elements.promptInput.value = '';
        
        // Dispatch custom event for game engine
        document.dispatchEvent(new CustomEvent('textInputSubmitted', {
            detail: { input }
        }));
    }

    // Text rendering with typewriter effect
    async renderText(text, container, options = {}) {
        if (!container) return;

        const {
            typewriter = true,
            speed = this.getTypewriterSpeed(),
            append = false,
            className = ''
        } = options;

        if (!append) {
            container.innerHTML = '';
        }

        const element = document.createElement('div');
        if (className) {
            element.className = className;
        }

        if (typewriter && this.textSpeed !== 'fast') {
            await this.typewriterEffect(text, element, speed);
        } else {
            element.innerHTML = text;
        }

        container.appendChild(element);
        this.scrollToBottom(container);
    }

    async typewriterEffect(text, element, speed) {
        this.isTyping = true;
        this.currentTypewriter = { cancelled: false };
        
        const typewriterInstance = this.currentTypewriter;
        
        // Parse HTML to handle tags properly
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        const textContent = doc.body.textContent || '';
        
        for (let i = 0; i < textContent.length; i++) {
            if (typewriterInstance.cancelled) break;
            
            element.textContent = textContent.substring(0, i + 1);
            await this.delay(speed);
        }
        
        // Set final HTML with formatting
        if (!typewriterInstance.cancelled) {
            element.innerHTML = text;
        }
        
        this.isTyping = false;
        this.currentTypewriter = null;
    }

    cancelTypewriter() {
        if (this.currentTypewriter) {
            this.currentTypewriter.cancelled = true;
        }
    }

    getTypewriterSpeed() {
        switch (this.textSpeed) {
            case 'slow': return 80;
            case 'medium': return 40;
            case 'fast': return 10;
            default: return 40;
        }
    }

    setTextSpeed(speed) {
        this.textSpeed = speed;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    scrollToBottom(element) {
        element.scrollTop = element.scrollHeight;
    }

    // Story rendering methods
    showIntroduction(introNode) {
        this.renderText(introNode.text, this.elements.output, {
            className: 'text-lg leading-relaxed mb-6'
        });
        
        this.renderChoices(introNode.choices);
    }

    renderStoryNode(node) {
        this.renderText(node.text, this.elements.output, {
            className: 'story-text mb-4'
        });
        
        if (node.choices) {
            this.renderChoices(node.choices);
        }
    }

    renderCharacterSelection(node, characters) {
        this.renderText(node.text, this.elements.output, {
            className: 'text-xl font-bold mb-4'
        });

        const choices = Object.keys(characters).map(charId => ({
            text: characters[charId].description,
            characterId: charId,
            nextNode: 'game_start'
        }));

        this.renderChoices(choices);
    }

    renderLocation(location, player) {
        // Play location transition sound
        this.playUISound('assets/audio/location-transition.mp3', 0.4);
        
        // Update background image
        if (location.backgroundImage) {
            this.setBackgroundImage(location.backgroundImage);
        }

        // Render location description
        const locationHtml = `
            <h2 class="text-3xl font-bold location-title mb-4">${location.name}</h2>
            <p class="text-lg leading-relaxed mb-4">${location.description}</p>
        `;

        this.renderText(locationHtml, this.elements.output);

        // Add environmental details
        if (location.environmentDetails && location.environmentDetails.length > 0) {
            const randomDetail = location.environmentDetails[
                Math.floor(Math.random() * location.environmentDetails.length)
            ];
            
            this.renderText(
                `<p class="text-gray-300 italic mt-2">${randomDetail}</p>`,
                this.elements.output,
                { append: true }
            );
        }

        // Update character location
        this.elements.currentLocation.textContent = location.name;
    }

    renderLocationHub(location, availableActions, player) {
        this.renderLocation(location, player);
        
        // Render available actions as choices
        this.renderChoices(availableActions);
    }

    renderDialogue(dialogueData) {
        const { npcData, currentNode } = dialogueData;
        const dialogueNode = npcData.dialogueTree[currentNode];
        
        if (!dialogueNode) {
            console.error(`Dialogue node ${currentNode} not found`);
            return;
        }

        const dialogueHtml = `
            <div class="dialogue-container bg-gray-800 border-l-4 border-blue-400 p-4 rounded-r-lg mb-4">
                <h3 class="font-bold text-blue-300 mb-2">${npcData.name}</h3>
                <p class="text-gray-200 mb-3">${dialogueNode.text}</p>
            </div>
        `;

        this.renderText(dialogueHtml, this.elements.output, { append: true });
        
        if (dialogueNode.choices) {
            this.renderChoices(dialogueNode.choices, 'dialogue');
        }
    }

    renderEvent(event) {
        const eventHtml = `
            <div class="event-container bg-red-900 border-l-4 border-red-400 p-4 rounded-r-lg mb-4">
                <h3 class="font-bold text-red-300 mb-2">${event.title}</h3>
                <p class="text-red-100 mb-3">${event.description}</p>
            </div>
        `;

        this.renderText(eventHtml, this.elements.output, { append: true });
        
        if (event.choices) {
            this.renderChoices(event.choices, 'event');
        }
    }

    renderChoices(choices, context = 'story') {
        if (!choices || choices.length === 0) return;

        this.elements.choicesContainer.innerHTML = '';

        choices.forEach((choice, index) => {
            const button = document.createElement('button');
            button.className = 'choice-btn';
            button.textContent = choice.text;
            button.disabled = choice.available === false;
            
            // Add accessibility attributes
            button.setAttribute('role', 'button');
            button.setAttribute('tabindex', '0');
            button.setAttribute('aria-label', `Choice ${index + 1}: ${choice.text}`);
            
            // Add keyboard support
            button.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    button.click();
                }
            });

            // Add hover sound effect
            button.addEventListener('mouseenter', () => {
                if (button.disabled) return;
                this.playUISound('assets/audio/button-hover.mp3');
            });

            button.addEventListener('click', () => {
                if (button.disabled) return;
                
                // Play button click sound
                this.playUISound('assets/audio/button-click.mp3');
                
                // Disable all choice buttons to prevent double-clicking
                this.disableAllChoices();
                
                // Dispatch choice selected event
                document.dispatchEvent(new CustomEvent('choiceSelected', {
                    detail: { choice, context, index }
                }));
            });

            this.elements.choicesContainer.appendChild(button);
        });
    }

    disableAllChoices() {
        const choiceButtons = this.elements.choicesContainer.querySelectorAll('.choice-btn');
        choiceButtons.forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.5';
        });
    }

    // Stats rendering
    updatePlayerStats(player) {
        if (!player || !player.stats) return;

        const currentStats = {
            tension: player.stats.tension || 0,
            morale: player.stats.morale || 0,
            ptsd: player.stats.ptsd || 0
        };

        // Play sound effects for stat changes
        if (currentStats.tension > this.previousStats.tension || currentStats.ptsd > this.previousStats.ptsd) {
            this.playUISound('assets/audio/stats-decrease.mp3', 0.4);
        } else if (currentStats.morale > this.previousStats.morale) {
            this.playUISound('assets/audio/stats-increase.mp3', 0.4);
        }

        // Update tension
        this.elements.tensionLevel.textContent = currentStats.tension;
        this.updateProgressBar(this.elements.tensionBar, currentStats.tension, 100);

        // Update morale
        this.elements.moraleLevel.textContent = currentStats.morale;
        this.updateProgressBar(this.elements.moraleBar, currentStats.morale, 100);

        // Update PTSD
        this.elements.ptsdLevel.textContent = currentStats.ptsd;
        this.updateProgressBar(this.elements.ptsdBar, currentStats.ptsd, 100);

        // Store current stats for next comparison
        this.previousStats = { ...currentStats };

        // Update faction reputation
        this.updateFactionReputation(player.factionReputation);

        // Update inventory
        this.updateInventory(player.inventory);

        // Update character info
        this.elements.characterName.textContent = player.name || '';
        this.elements.characterBackground.textContent = player.background || '';
    }

    updateProgressBar(barElement, value, max) {
        if (!barElement) return;
        const percentage = Math.max(0, Math.min(100, (value / max) * 100));
        barElement.style.width = `${percentage}%`;
    }

    updateFactionReputation(factionRep) {
        if (!factionRep || !this.elements.factionList) return;

        this.elements.factionList.innerHTML = '';

        Object.keys(factionRep).forEach(faction => {
            const reputation = factionRep[faction];
            const li = document.createElement('li');
            li.className = `faction-${faction.toLowerCase().replace(/\s+/g, '-')}`;
            
            const reputationText = this.getReputationText(reputation);
            li.innerHTML = `
                <span>${faction}</span>
                <div class="faction-meter">
                    <div class="faction-fill" style="width: ${this.getReputationPercentage(reputation)}%"></div>
                </div>
            `;
            
            this.elements.factionList.appendChild(li);
        });
    }

    getReputationText(reputation) {
        if (reputation >= 5) return 'Trusted';
        if (reputation >= 2) return 'Liked';
        if (reputation >= -1) return 'Neutral';
        if (reputation >= -4) return 'Disliked';
        return 'Hostile';
    }

    getReputationPercentage(reputation) {
        // Convert reputation range (-10 to 10) to percentage (0 to 100)
        return Math.max(0, Math.min(100, ((reputation + 10) / 20) * 100));
    }

    updateInventory(inventory) {
        if (!inventory || !this.elements.inventoryList) return;

        this.elements.inventoryList.innerHTML = '';

        if (inventory.length === 0) {
            const li = document.createElement('li');
            li.textContent = i18n.t('empty');
            li.className = 'text-gray-500 italic';
            this.elements.inventoryList.appendChild(li);
        } else {
            inventory.forEach(itemId => {
                const li = document.createElement('li');
                li.textContent = itemId.replace(/_/g, ' ');
                li.className = 'cursor-pointer hover:text-yellow-400';
                
                li.addEventListener('click', () => {
                    // Play inventory item click sound
                    this.playUISound('assets/audio/inventory-use.mp3');
                    
                    document.dispatchEvent(new CustomEvent('itemClicked', {
                        detail: { itemId }
                    }));
                });
                
                this.elements.inventoryList.appendChild(li);
            });
        }
    }

    updateGameStats(gameStats) {
        if (!gameStats) return;

        this.elements.choicesCount.textContent = gameStats.choicesMade || 0;
        this.elements.locationsCount.textContent = gameStats.locationsVisited?.size || 0;
        this.elements.npcsCount.textContent = gameStats.npcsMet?.size || 0;
        this.elements.eventsCount.textContent = gameStats.eventsWitnessed?.size || 0;
    }

    // Journal methods
    addJournalEntry(entry) {
        const entryElement = document.createElement('div');
        entryElement.className = `journal-entry ${entry.type}`;
        
        const timeString = new Date(entry.timestamp).toLocaleTimeString();
        entryElement.innerHTML = `
            <div class="text-xs text-gray-400 mb-1">${timeString} - ${entry.location}</div>
            <div class="text-sm">${entry.text}</div>
        `;
        
        this.elements.journalContent.appendChild(entryElement);
        this.scrollToBottom(this.elements.journalContent);
    }

    showJournal() {
        // This could open a modal or expand the journal sidebar
        this.elements.journalContent.scrollIntoView({ behavior: 'smooth' });
    }

    // Background and atmosphere
    setBackgroundImage(imageSrc) {
        if (!this.elements.backgroundImage) return;
        
        this.elements.backgroundImage.style.backgroundImage = `url(${imageSrc})`;
        this.elements.backgroundImage.classList.add('fade-in');
        
        // Reset fade-in class after animation
        setTimeout(() => {
            this.elements.backgroundImage.classList.remove('fade-in');
        }, 1000);
    }

    // Modal management
    showSettings() {
        this.elements.settingsModal?.classList.remove('hidden');
    }

    hideSettings() {
        this.elements.settingsModal?.classList.add('hidden');
    }

    showEnding(endingNode, player, sessionStats) {
        const modal = this.elements.endgameModal;
        if (!modal) return;

        const endingTitle = modal.querySelector('#ending-title');
        const endingContent = modal.querySelector('#ending-content');
        const finalStats = modal.querySelector('#final-stats');

        if (endingTitle) {
            endingTitle.textContent = endingNode.endingType?.toUpperCase() || 'GAME OVER';
            endingTitle.className = `text-3xl font-bold mb-4 ending-${endingNode.endingType}`;
        }

        if (endingContent) {
            endingContent.innerHTML = endingNode.text;
        }

        if (finalStats && sessionStats) {
            const playTime = sessionStats.playTimeFormatted || '0:00';

            finalStats.innerHTML = `
                <div>
                    <h4 class="font-bold mb-2">Final Statistics</h4>
                    <p>Play Time: ${playTime}</p>
                    <p>Choices Made: ${sessionStats.choicesMade}</p>
                    <p>Locations Visited: ${sessionStats.locationsVisited.length}</p>
                    <p>NPCs Met: ${sessionStats.npcsMet.length}</p>
                    <p>Events Witnessed: ${sessionStats.eventsWitnessed.length}</p>
                </div>
                <div>
                    <h4 class="font-bold mb-2">Final Stats</h4>
                    <p>Tension: ${player.stats.tension}</p>
                    <p>Morale: ${player.stats.morale}</p>
                    <p>PTSD: ${player.stats.ptsd}</p>
                </div>
            `;
        }

        // Play modal open sound
        this.playUISound('assets/audio/menu-open.mp3');
        
        modal.classList.remove('hidden');
    }

    closeAllModals() {
        const modals = document.querySelectorAll('.modal');
        if (modals.length > 0) {
            // Play modal close sound
            this.playUISound('assets/audio/menu-close.mp3');
        }
        modals.forEach(modal => {
            modal.classList.add('hidden');
        });
    }

    // Notifications
    showNotification(message, type = 'info') {
        // Play notification sound
        if (type === 'success') {
            this.playUISound('assets/audio/success-sound.mp3');
        } else if (type === 'error') {
            this.playUISound('assets/audio/error-sound.mp3');
        } else {
            this.playUISound('assets/audio/notification-alert.mp3');
        }
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Trigger show animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    showHelp() {
        const helpText = `
            <h3 class="text-xl font-bold mb-4">How to Play</h3>
            <ul class="list-disc list-inside space-y-2 text-sm">
                <li>Make choices by clicking on the available options</li>
                <li>Monitor your tension, morale, and PTSD levels</li>
                <li>Keep track of your relationships with different factions</li>
                <li>Use items from your inventory when appropriate</li>
                <li>Your choices have consequences - choose wisely</li>
            </ul>
            <h4 class="text-lg font-bold mt-4 mb-2">Keyboard Shortcuts</h4>
            <ul class="list-disc list-inside space-y-1 text-sm">
                <li>Ctrl+S: Save game</li>
                <li>Ctrl+L: Load game</li>
                <li>F1: Show this help</li>
                <li>Escape: Close modals</li>
            </ul>
        `;
        
        // Create temporary help modal
        const helpModal = document.createElement('div');
        helpModal.className = 'modal';
        helpModal.innerHTML = `
            <div class="modal-content glass-panel p-6 max-w-md mx-auto mt-20">
                ${helpText}
                <div class="flex justify-end mt-4">
                    <button class="control-btn bg-gray-600 hover:bg-gray-700" onclick="this.closest('.modal').remove()">
                        Close
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(helpModal);
    }

    // Reset UI state
    reset() {
        this.elements.output.innerHTML = '';
        this.elements.choicesContainer.innerHTML = '';
        this.elements.journalContent.innerHTML = '';
        this.elements.backgroundImage.style.backgroundImage = '';
        this.closeAllModals();
        
        // Reset stats
        this.elements.tensionLevel.textContent = '0';
        this.elements.moraleLevel.textContent = '0';
        this.elements.ptsdLevel.textContent = '0';
        this.updateProgressBar(this.elements.tensionBar, 0, 100);
        this.updateProgressBar(this.elements.moraleBar, 0, 100);
        this.updateProgressBar(this.elements.ptsdBar, 0, 100);
        
        // Reset character info
        this.elements.characterName.textContent = '';
        this.elements.characterBackground.textContent = '';
        this.elements.currentLocation.textContent = '';
        
        // Reset game stats
        this.elements.choicesCount.textContent = '0';
        this.elements.locationsCount.textContent = '0';
        this.elements.npcsCount.textContent = '0';
        this.elements.eventsCount.textContent = '0';
    }

    // UI Sound Effects
    playUISound(soundPath, volume = 0.3) {
        if (this.audioManager && this.audioManager.isEnabled) {
            this.audioManager.playEffectSound(soundPath, volume);
        }
    }

    setAudioManager(audioManager) {
        this.audioManager = audioManager;
    }
}