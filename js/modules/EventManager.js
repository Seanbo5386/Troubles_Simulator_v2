export class EventManager {
    constructor(eventsData) {
        this.eventsData = eventsData;
        this.triggeredEvents = new Set();
        this.activeEvent = null;
        this.eventHistory = [];
    }

    // Get events available for current context
    getAvailableEvents(locationId, player, gameStats) {
        const availableEvents = [];
        
        // Check violent events
        if (this.eventsData.violentEvents) {
            this.eventsData.violentEvents.forEach(event => {
                if (this.canTriggerEvent(event, locationId, player, gameStats)) {
                    availableEvents.push({ ...event, category: 'violence' });
                }
            });
        }
        
        // Check moral dilemmas
        if (this.eventsData.moralDilemmas) {
            this.eventsData.moralDilemmas.forEach(event => {
                if (this.canTriggerEvent(event, locationId, player, gameStats)) {
                    availableEvents.push({ ...event, category: 'moral' });
                }
            });
        }
        
        // Check random encounters
        if (this.eventsData.randomEncounters) {
            this.eventsData.randomEncounters.forEach(event => {
                if (this.canTriggerRandomEvent(event, locationId, player, gameStats)) {
                    availableEvents.push({ ...event, category: 'encounter' });
                }
            });
        }
        
        return availableEvents;
    }

    // Check if an event can be triggered
    canTriggerEvent(event, locationId, player, gameStats) {
        // Check if already triggered and shouldn't repeat
        if (this.triggeredEvents.has(event.id) && !event.repeatable) {
            return false;
        }
        
        // Check location requirement
        if (event.location && event.location !== locationId) {
            return false;
        }
        
        // Check if event can trigger in multiple locations
        if (event.locations && !event.locations.includes(locationId)) {
            return false;
        }
        
        // Check trigger conditions
        if (event.triggerConditions) {
            return this.evaluateTriggerConditions(event.triggerConditions, player, gameStats);
        }
        
        return true;
    }

    // Check if a random event can be triggered
    canTriggerRandomEvent(event, locationId, player, gameStats) {
        // Check basic conditions first
        if (!this.canTriggerEvent(event, locationId, player, gameStats)) {
            return false;
        }
        
        // Check random chance
        const chance = event.triggerChance || 0.1;
        return Math.random() < chance;
    }

    // Evaluate trigger conditions
    evaluateTriggerConditions(conditions, player, gameStats) {
        // Check minimum tension
        if (conditions.minTension && player.stats.tension < conditions.minTension) {
            return false;
        }
        
        // Check maximum tension
        if (conditions.maxTension && player.stats.tension > conditions.maxTension) {
            return false;
        }
        
        // Check minimum morale
        if (conditions.minMorale && player.stats.morale < conditions.minMorale) {
            return false;
        }
        
        // Check maximum morale
        if (conditions.maxMorale && player.stats.morale > conditions.maxMorale) {
            return false;
        }
        
        // Check minimum PTSD
        if (conditions.minPtsd && player.stats.ptsd < conditions.minPtsd) {
            return false;
        }
        
        // Check character ID
        if (conditions.characterId && player.id !== conditions.characterId) {
            return false;
        }
        
        // Check required items
        if (conditions.requiredItems) {
            for (const item of conditions.requiredItems) {
                if (!player.inventory.includes(item)) {
                    return false;
                }
            }
        }
        
        // Check faction reputation
        if (conditions.factionReputation) {
            for (const faction in conditions.factionReputation) {
                const required = conditions.factionReputation[faction];
                const current = player.factionReputation[faction] || 0;
                
                if (typeof required === 'object') {
                    if (required.min !== undefined && current < required.min) return false;
                    if (required.max !== undefined && current > required.max) return false;
                } else {
                    if (current !== required) return false;
                }
            }
        }
        
        // Check excluded events
        if (conditions.excludeIfTriggered) {
            for (const excludedEvent of conditions.excludeIfTriggered) {
                if (this.triggeredEvents.has(excludedEvent)) {
                    return false;
                }
            }
        }
        
        // Check minimum choices made
        if (conditions.minChoices && gameStats.choicesMade < conditions.minChoices) {
            return false;
        }
        
        // Check time-based conditions
        if (conditions.timeInGame) {
            const gameTime = Date.now() - gameStats.startTime;
            if (gameTime < conditions.timeInGame) {
                return false;
            }
        }
        
        return true;
    }

    // Trigger an event
    triggerEvent(event, player, gameStats) {
        console.log(`Triggering event: ${event.id}`);
        
        // Mark as triggered
        this.triggeredEvents.add(event.id);
        
        // Set as active event
        this.activeEvent = {
            ...event,
            triggeredAt: Date.now(),
            triggeredLocation: player.location
        };
        
        // Add to history
        this.eventHistory.push({
            eventId: event.id,
            timestamp: Date.now(),
            location: player.location,
            playerStats: { ...player.stats },
            category: event.category
        });
        
        return this.activeEvent;
    }

    // Process event choice
    processEventChoice(choice, player) {
        if (!this.activeEvent) {
            console.warn('No active event to process choice for');
            return null;
        }
        
        const result = {
            eventId: this.activeEvent.id,
            choice: choice.text,
            consequence: choice.consequence,
            effects: choice.effects || {},
            completedAt: Date.now()
        };
        
        // Apply choice effects to player
        if (choice.effects) {
            this.applyEventEffects(choice.effects, player);
        }
        
        // Clear active event
        this.activeEvent = null;
        
        return result;
    }

    // Apply event effects to player
    applyEventEffects(effects, player) {
        // Apply stat changes
        Object.keys(effects).forEach(key => {
            if (key === 'factionReputation') {
                Object.keys(effects[key]).forEach(faction => {
                    if (player.factionReputation[faction] !== undefined) {
                        player.factionReputation[faction] += effects[key][faction];
                        // Clamp reputation values
                        player.factionReputation[faction] = Math.max(-10, Math.min(10, player.factionReputation[faction]));
                    }
                });
            } else if (key === 'npcRelations') {
                Object.keys(effects[key]).forEach(npc => {
                    if (player.npcRelationships[npc] === undefined) {
                        player.npcRelationships[npc] = 0;
                    }
                    player.npcRelationships[npc] += effects[key][npc];
                    player.npcRelationships[npc] = Math.max(-10, Math.min(10, player.npcRelationships[npc]));
                });
            } else if (player.stats[key] !== undefined) {
                player.stats[key] += effects[key];
                
                // Clamp stat values
                if (key === 'tension' || key === 'morale' || key === 'ptsd') {
                    player.stats[key] = Math.max(0, Math.min(100, player.stats[key]));
                }
            }
        });
        
        // Apply inventory changes
        if (effects.addItems) {
            effects.addItems.forEach(item => {
                if (!player.inventory.includes(item)) {
                    player.inventory.push(item);
                }
            });
        }
        
        if (effects.removeItems) {
            effects.removeItems.forEach(item => {
                player.inventory = player.inventory.filter(i => i !== item);
            });
        }
        
        // Apply flags
        if (effects.setFlags) {
            Object.keys(effects.setFlags).forEach(flag => {
                player.flags[flag] = effects.setFlags[flag];
            });
        }
    }

    // Get event statistics
    getEventStatistics() {
        const categories = {};
        const locations = {};
        
        this.eventHistory.forEach(event => {
            // Count by category
            categories[event.category] = (categories[event.category] || 0) + 1;
            
            // Count by location
            locations[event.location] = (locations[event.location] || 0) + 1;
        });
        
        return {
            totalEvents: this.eventHistory.length,
            triggeredEvents: this.triggeredEvents.size,
            categoriesCounts: categories,
            locationCounts: locations,
            activeEvent: this.activeEvent ? this.activeEvent.id : null
        };
    }

    // Get events by category
    getEventsByCategory(category) {
        return this.eventHistory.filter(event => event.category === category);
    }

    // Get violent events witnessed
    getViolentEventsWitnessed() {
        return this.getEventsByCategory('violence');
    }

    // Get moral choices made
    getMoralChoicesMade() {
        return this.getEventsByCategory('moral');
    }

    // Check if player has witnessed specific types of violence
    hasWitnessedViolence(type = null) {
        const violentEvents = this.getViolentEventsWitnessed();
        
        if (!type) {
            return violentEvents.length > 0;
        }
        
        return violentEvents.some(event => {
            const eventData = this.eventsData.violentEvents.find(e => e.id === event.eventId);
            return eventData && eventData.violenceType === type;
        });
    }

    // Get trauma score based on events witnessed
    getTraumaScore() {
        let trauma = 0;
        
        this.eventHistory.forEach(event => {
            const eventData = this.findEventData(event.eventId);
            if (eventData && eventData.traumaValue) {
                trauma += eventData.traumaValue;
            } else if (event.category === 'violence') {
                trauma += 10; // Default trauma value for violent events
            } else if (event.category === 'moral') {
                trauma += 5; // Default trauma value for moral dilemmas
            }
        });
        
        return trauma;
    }

    // Find event data by ID
    findEventData(eventId) {
        // Search in all event categories
        const allEvents = [
            ...(this.eventsData.violentEvents || []),
            ...(this.eventsData.moralDilemmas || []),
            ...(this.eventsData.randomEncounters || [])
        ];
        
        return allEvents.find(event => event.id === eventId);
    }

    // Reset event state (for new game)
    reset() {
        this.triggeredEvents.clear();
        this.activeEvent = null;
        this.eventHistory = [];
    }

    // Save event state
    getEventState() {
        return {
            triggeredEvents: Array.from(this.triggeredEvents),
            eventHistory: [...this.eventHistory],
            activeEvent: this.activeEvent
        };
    }

    // Restore event state
    restoreEventState(state) {
        if (!state) return;
        
        this.triggeredEvents = new Set(state.triggeredEvents || []);
        this.eventHistory = state.eventHistory || [];
        this.activeEvent = state.activeEvent || null;
    }

    // Debug methods
    getAllAvailableEvents() {
        const allEvents = [
            ...(this.eventsData.violentEvents || []),
            ...(this.eventsData.moralDilemmas || []),
            ...(this.eventsData.randomEncounters || [])
        ];
        
        return allEvents.map(event => ({
            id: event.id,
            title: event.title,
            location: event.location || event.locations,
            category: event.type,
            triggered: this.triggeredEvents.has(event.id)
        }));
    }

    // Force trigger event (for testing)
    forceEvent(eventId, player, gameStats) {
        const eventData = this.findEventData(eventId);
        if (!eventData) {
            console.warn(`Event ${eventId} not found`);
            return null;
        }
        
        return this.triggerEvent(eventData, player, gameStats);
    }

    // Validate events data
    validateEventsData() {
        const issues = [];
        
        // Check for duplicate event IDs
        const allIds = [];
        const categories = ['violentEvents', 'moralDilemmas', 'randomEncounters'];
        
        categories.forEach(category => {
            if (this.eventsData[category]) {
                this.eventsData[category].forEach(event => {
                    if (allIds.includes(event.id)) {
                        issues.push(`Duplicate event ID: ${event.id}`);
                    } else {
                        allIds.push(event.id);
                    }
                    
                    // Check required fields
                    if (!event.title) {
                        issues.push(`Event ${event.id} missing title`);
                    }
                    if (!event.description) {
                        issues.push(`Event ${event.id} missing description`);
                    }
                    if (!event.choices || event.choices.length === 0) {
                        issues.push(`Event ${event.id} has no choices`);
                    }
                });
            }
        });
        
        return {
            isValid: issues.length === 0,
            issues
        };
    }
}