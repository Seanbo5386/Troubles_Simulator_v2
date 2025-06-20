import { i18n } from './i18n.js';

export class UIRenderer {
    constructor(audioManager = null) {
        this.elements = {};
        this.textSpeed = 'medium';
        this.isTyping = false;
        this.currentTypewriter = null;
        this.audioManager = audioManager;
        this.previousStats = { tension: 0, morale: 0, ptsd: 0 };
        this.modalOpener = null;
    }

    async init() {
        console.debug('UIRenderer.init');
        this.cacheElements();
        this.setupEventListeners();
        console.log('UI Renderer initialized');
    }

    cacheElements() {
        console.debug('UIRenderer.cacheElements');
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
            npcRelationsList: document.getElementById('npc-relations-list'),
            
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
            locationDisplay: document.getElementById('location-display'),
            
            // Modals
            settingsModal: document.getElementById('settings-modal'),
            endgameModal: document.getElementById('endgame-modal'),
            glossaryModal: document.getElementById('glossary-modal'),
            glossaryContent: document.getElementById('glossary-content')
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
        console.debug('UIRenderer.handleTextInput');
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
        console.debug('UIRenderer.renderText', { text, options });
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
        console.debug('UIRenderer.typewriterEffect', { text, speed });
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
        console.debug('UIRenderer.cancelTypewriter');
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
        console.debug('UIRenderer.setTextSpeed', speed);
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
        console.debug('UIRenderer.showIntroduction', introNode);
        this.renderText(introNode.text, this.elements.output, {
            className: 'text-lg leading-relaxed mb-6'
        });
        
        this.renderChoices(introNode.choices);
    }

    renderStoryNode(node) {
        console.debug('UIRenderer.renderStoryNode', node);
        this.renderText(node.text, this.elements.output, {
            className: 'story-text mb-4'
        });
        
        if (node.choices) {
            this.renderChoices(node.choices);
        }
    }

    renderCharacterSelection(node, characters) {
        console.debug('UIRenderer.renderCharacterSelection', { node, characters });
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
        console.debug('UIRenderer.renderLocation', { location, player });
        // Play location transition sound
        this.playUISound('assets/audio/location-transition.mp3', 0.4);
        
        // Update background image
        if (location.backgroundImage) {
            this.setBackgroundImage(location.backgroundImage);
        }

        // Clear main output
        if (this.elements.output) {
            this.elements.output.innerHTML = '';
        }

        // Render location description to dedicated display
        const locationHtml = `
            <h2 class="text-3xl font-bold location-title mb-1">${location.name}</h2>
            <p class="text-lg leading-relaxed">${location.description}</p>
        `;

        this.renderText(locationHtml, this.elements.locationDisplay, { append: false });

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
        console.debug('UIRenderer.renderLocationHub', { location, availableActions });
        this.renderLocation(location, player);
        
        // Render available actions as choices
        this.renderChoices(availableActions);
    }

    renderDialogue(dialogueData) {
        console.debug('UIRenderer.renderDialogue', dialogueData);
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
        console.debug('UIRenderer.renderEvent', event);
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
        console.debug('UIRenderer.renderChoices', { choices, context });
        if (!choices || choices.length === 0) return;

        this.elements.choicesContainer.innerHTML = '';

        choices.forEach((choice, index) => {
            const button = document.createElement('button');
            button.className = 'choice-btn';
            button.textContent = choice.text;
            button.disabled = choice.available === false;
            button.setAttribute('aria-disabled', button.disabled ? 'true' : 'false');
            
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
        console.debug('UIRenderer.disableAllChoices');
        const choiceButtons = this.elements.choicesContainer.querySelectorAll('.choice-btn');
        choiceButtons.forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.setAttribute('aria-disabled', 'true');
        });
    }

    // Stats rendering
    updatePlayerStats(player) {
        console.debug('UIRenderer.updatePlayerStats', player);
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

        // Update journal degradation based on player condition
        this.updateJournalAppearance(currentStats);

        // Update faction reputation
        this.updateFactionReputation(player.factionReputation);

        // Update NPC relationships
        this.updateNpcRelationships(player.npcRelationships);

        // Update inventory
        this.updateInventory(player.inventory);

        // Update character info
        this.elements.characterName.textContent = player.name || '';
        this.elements.characterBackground.textContent = player.background || '';
    }

    updateProgressBar(barElement, value, max) {
        console.debug('UIRenderer.updateProgressBar', { value, max });
        if (!barElement) return;
        const percentage = Math.max(0, Math.min(100, (value / max) * 100));
        barElement.style.width = `${percentage}%`;
    }

    updateJournalAppearance(stats) {
        console.debug('UIRenderer.updateJournalAppearance', stats);
        if (!this.elements.journalContent) return;

        const container = this.elements.journalContent;

        // Calculate stress level using tension and PTSD opposed by morale
        const stressScore = (stats.tension * 0.4 + stats.ptsd * 0.6) -
            (stats.morale * 0.3);
        const normalized = Math.max(0, Math.min(100, stressScore));
        const level = Math.min(4, Math.floor(normalized / 25));

        // Remove previous degrade classes
        for (let i = 0; i <= 4; i++) {
            container.classList.remove(`degrade-${i}`);
        }

        container.classList.add(`degrade-${level}`);
    }

    updateFactionReputation(factionRep) {
        console.debug('UIRenderer.updateFactionReputation', factionRep);
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

    updateNpcRelationships(npcRel) {
        console.debug('UIRenderer.updateNpcRelationships', npcRel);
        if (!npcRel || !this.elements.npcRelationsList) return;

        this.elements.npcRelationsList.innerHTML = '';

        Object.keys(npcRel).forEach(npc => {
            const value = npcRel[npc];
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${npc.replace(/_/g, ' ')}</span>
                <div class="faction-meter">
                    <div class="faction-fill" style="width: ${this.getReputationPercentage(value)}%"></div>
                </div>
            `;
            this.elements.npcRelationsList.appendChild(li);
        });
    }

    updateInventory(inventory) {
        console.debug('UIRenderer.updateInventory', inventory);
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
        console.debug('UIRenderer.updateGameStats', gameStats);
        if (!gameStats) return;

        this.elements.choicesCount.textContent = gameStats.choicesMade || 0;
        this.elements.locationsCount.textContent = gameStats.locationsVisited?.size || 0;
        this.elements.npcsCount.textContent = gameStats.npcsMet?.size || 0;
        this.elements.eventsCount.textContent = gameStats.eventsWitnessed?.size || 0;
    }

    // Journal methods
    addJournalEntry(entry) {
        console.debug('UIRenderer.addJournalEntry', entry);
        const entryElement = document.createElement('div');
        entryElement.className = `journal-entry ${entry.type}`;

        const timeString = new Date(entry.timestamp).toLocaleTimeString();
        const subjectiveText = entry.text;

        entryElement.innerHTML = `
            <div class="text-xs text-gray-400 mb-1">${timeString} - ${entry.location}</div>
            <div class="text-sm">${subjectiveText}</div>
        `;

        entryElement.title = entry.objectiveText;

        this.elements.journalContent.appendChild(entryElement);
        this.scrollToBottom(this.elements.journalContent);
    }

    showJournal() {
        console.debug('UIRenderer.showJournal');
        // This could open a modal or expand the journal sidebar
        this.elements.journalContent.scrollIntoView({ behavior: 'smooth' });
    }

    // Background and atmosphere
    setBackgroundImage(imageSrc) {
        console.debug('UIRenderer.setBackgroundImage', imageSrc);
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
        console.debug('UIRenderer.showSettings');
        const modal = this.elements.settingsModal;
        if (!modal) return;
        const opener = document.activeElement;
        modal.classList.remove('hidden');
        modal.setAttribute('aria-hidden', 'false');
        this.manageModalFocus(modal, opener);
    }

    hideSettings() {
        console.debug('UIRenderer.hideSettings');
        const modal = this.elements.settingsModal;
        if (!modal) return;
        modal.classList.add('hidden');
        modal.setAttribute('aria-hidden', 'true');
        if (modal.trapFocusHandler) {
            modal.removeEventListener('keydown', modal.trapFocusHandler);
            modal.trapFocusHandler = null;
        }
        if (this.modalOpener) {
            this.modalOpener.focus();
            this.modalOpener = null;
        }
    }

    showGlossary(glossary = {}) {
        console.debug('UIRenderer.showGlossary');
        const modal = this.elements.glossaryModal;
        const content = this.elements.glossaryContent;
        if (!modal || !content) return;

        content.innerHTML = '';
        Object.values(glossary).forEach(entry => {
            const div = document.createElement('div');
            div.innerHTML = `
                <h3 class="font-semibold mb-1">${entry.title}</h3>
                <p>${entry.description}</p>
            `;
            content.appendChild(div);
        });

        this.playUISound('assets/audio/menu-open.mp3');
        const opener = document.activeElement;
        modal.classList.remove('hidden');
        modal.setAttribute('aria-hidden', 'false');
        this.manageModalFocus(modal, opener);
    }

    hideGlossary() {
        console.debug('UIRenderer.hideGlossary');
        const modal = this.elements.glossaryModal;
        if (!modal) return;
        modal.classList.add('hidden');
        modal.setAttribute('aria-hidden', 'true');
        if (modal.trapFocusHandler) {
            modal.removeEventListener('keydown', modal.trapFocusHandler);
            modal.trapFocusHandler = null;
        }
        if (this.modalOpener) {
            this.modalOpener.focus();
            this.modalOpener = null;
        }
    }

    showEnding(endingNode, player, sessionStats, achievements = []) {
        console.debug('UIRenderer.showEnding', { endingNode, sessionStats });
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
                <div>
                    <h4 class="font-bold mb-2">Achievements Unlocked</h4>
                    <ul class="list-disc list-inside text-sm">
                        ${achievements.map(a => `<li>${a}</li>`).join('') || '<li>None</li>'}
                    </ul>
                </div>
            `;

            if (achievements && achievements.length > 0) {
                achievements.forEach(name => {
                    this.showNotification(`Achievement unlocked: ${name}`, 'success');
                });
            }
        }

        // Play modal open sound
        this.playUISound('assets/audio/menu-open.mp3');

        const opener = document.activeElement;
        modal.classList.remove('hidden');
        modal.setAttribute('aria-hidden', 'false');
        this.manageModalFocus(modal, opener);
    }

    manageModalFocus(modal, opener) {
        console.debug('UIRenderer.manageModalFocus');
        if (!modal) return;
        this.modalOpener = opener || null;

        const focusableSelectors = 'a[href], button:not([disabled]), textarea, input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
        const focusable = Array.from(modal.querySelectorAll(focusableSelectors));
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        const trapFocus = (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        };

        modal.trapFocusHandler = trapFocus;
        modal.addEventListener('keydown', trapFocus);
        first.focus();
    }

    closeAllModals() {
        console.debug('UIRenderer.closeAllModals');
        const modals = document.querySelectorAll('.modal');
        if (modals.length > 0) {
            // Play modal close sound
            this.playUISound('assets/audio/menu-close.mp3');
        }
        modals.forEach(modal => {
            modal.classList.add('hidden');
            modal.setAttribute('aria-hidden', 'true');
            if (modal.trapFocusHandler) {
                modal.removeEventListener('keydown', modal.trapFocusHandler);
                modal.trapFocusHandler = null;
            }
        });

        if (this.modalOpener) {
            this.modalOpener.focus();
            this.modalOpener = null;
        }
    }

    // Notifications
    showNotification(message, type = 'info') {
        console.debug('UIRenderer.showNotification', { message, type });
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
        console.debug('UIRenderer.showHelp');
        const helpText = `
            <h3 class="text-xl font-bold mb-4">How to Play</h3>
            <ul class="list-disc list-inside space-y-2 text-sm">
                <li>Make choices by clicking on the available options</li>
                <li>Monitor your tension, morale, and PTSD levels</li>
                <li>Keep track of your relationships with factions and individuals</li>
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
        console.debug('UIRenderer.reset');
        this.elements.output.innerHTML = '';
        this.elements.choicesContainer.innerHTML = '';
        this.elements.journalContent.innerHTML = '';
        ['degrade-0','degrade-1','degrade-2','degrade-3','degrade-4'].forEach(c=>
            this.elements.journalContent.classList.remove(c));
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
        if (this.elements.locationDisplay) {
            this.elements.locationDisplay.innerHTML = '';
        }
        
        // Reset game stats
        this.elements.choicesCount.textContent = '0';
        this.elements.locationsCount.textContent = '0';
        this.elements.npcsCount.textContent = '0';
        this.elements.eventsCount.textContent = '0';
    }

    // UI Sound Effects
    playUISound(soundPath, volume = 0.3) {
        console.debug('UIRenderer.playUISound', { soundPath, volume });
        if (this.audioManager && this.audioManager.isEnabled) {
            this.audioManager.playEffectSound(soundPath, volume);
        }
    }

    setAudioManager(audioManager) {
        console.debug('UIRenderer.setAudioManager');
        this.audioManager = audioManager;
    }
}