export class StatsManager {
    constructor() {
        this.sessionStats = this.initializeSessionStats();
        this.permanentStats = this.loadPermanentStats();
        this.achievements = new Set();
        this.milestones = [];
    }

    initializeSessionStats() {
        return {
            gameStartTime: null,
            gameEndTime: null,
            totalPlayTime: 0,
            choicesMade: 0,
            locationsVisited: new Set(),
            npcsMet: new Set(),
            eventsWitnessed: new Set(),
            itemsFound: new Set(),
            itemsUsed: new Set(),
            dialoguesCompleted: new Set(),
            
            // Character progression
            maxTensionReached: 0,
            maxMoraleReached: 0,
            maxPtsdReached: 0,
            
            // Faction relationships
            bestFactionRelationship: { faction: null, value: 0 },
            worstFactionRelationship: { faction: null, value: 0 },
            bestNpcRelationship: { npc: null, value: 0 },
            worstNpcRelationship: { npc: null, value: 0 },
            
            // Violence and moral choices
            violentEventsWitnessed: 0,
            moralChoicesMade: 0,
            heroicActions: 0,
            selfishActions: 0,
            
            // Endings
            endingReached: null,
            endingType: null,
            
            // Performance metrics
            averageChoiceTime: 0,
            choiceTimes: [],
            
            // Death/failure tracking
            deathCount: 0,
            restartCount: 0
        };
    }

    initializePermanentStats() {
        return {
            totalGamesPlayed: 0,
            totalPlayTime: 0,
            totalChoicesMade: 0,

            // Completion tracking
            endingsUnlocked: new Set(),
            charactersPlayed: new Set(),
            locationsDiscovered: new Set(),
            eventsEncountered: new Set(),

            // Best/worst records
            bestGame: null,
            longestGame: null,
            shortestGame: null,

            // Achievement tracking
            achievementsUnlocked: new Set(),
            achievementProgress: {},

            // First play date
            firstPlayDate: null,
            lastPlayDate: null
        };
    }

    loadPermanentStats() {
        try {
            const saved = localStorage.getItem('troubles_simulator_permanent_stats');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (error) {
            console.warn('Failed to load permanent stats:', error);
        }

        return this.initializePermanentStats();
    }

    savePermanentStats() {
        try {
            const statsToSave = {
                ...this.permanentStats,
                endingsUnlocked: Array.from(this.permanentStats.endingsUnlocked),
                charactersPlayed: Array.from(this.permanentStats.charactersPlayed),
                locationsDiscovered: Array.from(this.permanentStats.locationsDiscovered),
                eventsEncountered: Array.from(this.permanentStats.eventsEncountered),
                achievementsUnlocked: Array.from(this.permanentStats.achievementsUnlocked)
            };
            
            localStorage.setItem('troubles_simulator_permanent_stats', JSON.stringify(statsToSave));
        } catch (error) {
            console.error('Failed to save permanent stats:', error);
        }
    }

    // Session tracking methods
    startSession(characterId) {
        this.sessionStats.gameStartTime = Date.now();
        this.sessionStats.choicesMade = 0;
        this.sessionStats.locationsVisited.clear();
        this.sessionStats.npcsMet.clear();
        this.sessionStats.eventsWitnessed.clear();
        
        // Update permanent stats
        if (!this.permanentStats.firstPlayDate) {
            this.permanentStats.firstPlayDate = Date.now();
        }
        this.permanentStats.lastPlayDate = Date.now();
        this.permanentStats.charactersPlayed.add(characterId);
        
        console.log(`Stats session started for character: ${characterId}`);
    }

    endSession(endingType = null) {
        this.sessionStats.gameEndTime = Date.now();
        this.sessionStats.endingReached = endingType;
        
        if (this.sessionStats.gameStartTime) {
            this.sessionStats.totalPlayTime = this.sessionStats.gameEndTime - this.sessionStats.gameStartTime;
        }
        
        // Update permanent stats
        this.permanentStats.totalGamesPlayed++;
        this.permanentStats.totalPlayTime += this.sessionStats.totalPlayTime;
        this.permanentStats.totalChoicesMade += this.sessionStats.choicesMade;
        
        if (endingType) {
            this.permanentStats.endingsUnlocked.add(endingType);
        }
        
        // Merge session discoveries into permanent stats
        this.sessionStats.locationsVisited.forEach(loc => 
            this.permanentStats.locationsDiscovered.add(loc)
        );
        this.sessionStats.eventsWitnessed.forEach(event => 
            this.permanentStats.eventsEncountered.add(event)
        );
        
        // Check for new records
        this.updateRecords();
        
        // Check achievements
        this.checkAchievements();
        
        this.savePermanentStats();
        console.log('Stats session ended');
    }

    // Choice tracking
    recordChoice(choice, responseTime = 0) {
        this.sessionStats.choicesMade++;
        
        if (responseTime > 0) {
            this.sessionStats.choiceTimes.push(responseTime);
            this.sessionStats.averageChoiceTime = 
                this.sessionStats.choiceTimes.reduce((a, b) => a + b, 0) / 
                this.sessionStats.choiceTimes.length;
        }
        
        // Analyze choice type
        this.analyzeChoiceType(choice);
    }

    analyzeChoiceType(choice) {
        if (!choice.effects) return;
        
        // Check if it's a moral choice
        if (choice.category === 'moral' || choice.type === 'moral') {
            this.sessionStats.moralChoicesMade++;
        }
        
        // Analyze choice effects to determine if heroic or selfish
        const effects = choice.effects;
        let heroicScore = 0;
        let selfishScore = 0;
        
        // Heroic indicators
        if (effects.morale && effects.morale > 0) heroicScore++;
        if (effects.factionReputation) {
            Object.values(effects.factionReputation).forEach(value => {
                if (value > 0) heroicScore++;
            });
        }
        if (choice.text.toLowerCase().includes('help') || 
            choice.text.toLowerCase().includes('save') ||
            choice.text.toLowerCase().includes('protect')) {
            heroicScore++;
        }
        
        // Selfish indicators
        if (effects.tension && effects.tension < 0) selfishScore++;
        if (choice.text.toLowerCase().includes('flee') ||
            choice.text.toLowerCase().includes('ignore') ||
            choice.text.toLowerCase().includes('refuse')) {
            selfishScore++;
        }
        
        if (heroicScore > selfishScore) {
            this.sessionStats.heroicActions++;
        } else if (selfishScore > heroicScore) {
            this.sessionStats.selfishActions++;
        }
    }

    // Location tracking
    visitLocation(locationId) {
        this.sessionStats.locationsVisited.add(locationId);
    }

    // NPC tracking
    meetNPC(npcId) {
        this.sessionStats.npcsMet.add(npcId);
    }

    // Event tracking
    witnessEvent(eventId, eventType) {
        this.sessionStats.eventsWitnessed.add(eventId);
        
        if (eventType === 'violence') {
            this.sessionStats.violentEventsWitnessed++;
        }
    }

    // Item tracking
    findItem(itemId) {
        this.sessionStats.itemsFound.add(itemId);
    }

    useItem(itemId) {
        this.sessionStats.itemsUsed.add(itemId);
    }

    // Stats updates
    updatePlayerStats(player) {
        if (!player || !player.stats) return;
        
        // Track maximum values reached
        this.sessionStats.maxTensionReached = Math.max(
            this.sessionStats.maxTensionReached, 
            player.stats.tension || 0
        );
        this.sessionStats.maxMoraleReached = Math.max(
            this.sessionStats.maxMoraleReached, 
            player.stats.morale || 0
        );
        this.sessionStats.maxPtsdReached = Math.max(
            this.sessionStats.maxPtsdReached, 
            player.stats.ptsd || 0
        );
        
        // Track faction relationships
        if (player.factionReputation) {
            Object.keys(player.factionReputation).forEach(faction => {
                const reputation = player.factionReputation[faction];
                
                if (reputation > this.sessionStats.bestFactionRelationship.value) {
                    this.sessionStats.bestFactionRelationship = {
                        faction,
                        value: reputation
                    };
                }
                
                if (reputation < this.sessionStats.worstFactionRelationship.value) {
                    this.sessionStats.worstFactionRelationship = {
                        faction,
                        value: reputation
                    };
                }
            });
        }

        // Track NPC relationships
        if (player.npcRelationships) {
            Object.keys(player.npcRelationships).forEach(npc => {
                const value = player.npcRelationships[npc];

                if (value > this.sessionStats.bestNpcRelationship.value) {
                    this.sessionStats.bestNpcRelationship = {
                        npc,
                        value
                    };
                }

                if (value < this.sessionStats.worstNpcRelationship.value) {
                    this.sessionStats.worstNpcRelationship = {
                        npc,
                        value
                    };
                }
            });
        }
    }

    // Records tracking
    updateRecords() {
        const currentGame = {
            playTime: this.sessionStats.totalPlayTime,
            choicesMade: this.sessionStats.choicesMade,
            locationsVisited: this.sessionStats.locationsVisited.size,
            endingType: this.sessionStats.endingReached,
            date: Date.now()
        };
        
        // Longest game
        if (!this.permanentStats.longestGame || 
            currentGame.playTime > this.permanentStats.longestGame.playTime) {
            this.permanentStats.longestGame = currentGame;
        }
        
        // Shortest completed game
        if (currentGame.endingType && 
            (!this.permanentStats.shortestGame || 
             currentGame.playTime < this.permanentStats.shortestGame.playTime)) {
            this.permanentStats.shortestGame = currentGame;
        }
        
        // Best game (most locations visited)
        if (!this.permanentStats.bestGame || 
            currentGame.locationsVisited > this.permanentStats.bestGame.locationsVisited) {
            this.permanentStats.bestGame = currentGame;
        }
    }

    // Achievement system
    checkAchievements() {
        const newAchievements = [];
        
        // First time achievements
        if (this.permanentStats.totalGamesPlayed === 1) {
            newAchievements.push('first_game');
        }
        
        // Completion achievements
        if (this.sessionStats.endingReached) {
            newAchievements.push(`ending_${this.sessionStats.endingReached}`);
        }
        
        // Choice-based achievements
        if (this.sessionStats.choicesMade >= 50) {
            newAchievements.push('decision_maker');
        }
        
        if (this.sessionStats.heroicActions >= 10) {
            newAchievements.push('hero');
        }
        
        if (this.sessionStats.selfishActions >= 10) {
            newAchievements.push('survivor');
        }
        
        // Location achievements
        if (this.sessionStats.locationsVisited.size >= 8) {
            newAchievements.push('explorer');
        }
        
        // Violence achievements
        if (this.sessionStats.violentEventsWitnessed >= 5) {
            newAchievements.push('witness');
        }
        
        // Stats achievements
        if (this.sessionStats.maxTensionReached >= 90) {
            newAchievements.push('on_the_edge');
        }
        
        if (this.sessionStats.maxMoraleReached >= 90) {
            newAchievements.push('optimist');
        }
        
        // Collection achievements
        if (this.permanentStats.endingsUnlocked.size >= 3) {
            newAchievements.push('all_endings');
        }
        
        if (this.permanentStats.charactersPlayed.size >= 4) {
            newAchievements.push('versatile');
        }
        
        // Time-based achievements
        const playTimeHours = this.sessionStats.totalPlayTime / (1000 * 60 * 60);
        if (playTimeHours >= 2) {
            newAchievements.push('dedicated');
        }
        
        // Permanent achievements
        if (this.permanentStats.totalGamesPlayed >= 10) {
            newAchievements.push('veteran');
        }
        
        // Add new achievements
        newAchievements.forEach(achievement => {
            if (!this.permanentStats.achievementsUnlocked.has(achievement)) {
                this.permanentStats.achievementsUnlocked.add(achievement);
                this.achievements.add(achievement);
                console.log(`Achievement unlocked: ${achievement}`);
            }
        });
        
        return newAchievements;
    }

    // Get statistics for display
    getSessionStatistics() {
        return {
            ...this.sessionStats,
            locationsVisited: Array.from(this.sessionStats.locationsVisited),
            npcsMet: Array.from(this.sessionStats.npcsMet),
            eventsWitnessed: Array.from(this.sessionStats.eventsWitnessed),
            itemsFound: Array.from(this.sessionStats.itemsFound),
            itemsUsed: Array.from(this.sessionStats.itemsUsed),
            playTimeFormatted: this.formatPlayTime(this.sessionStats.totalPlayTime)
        };
    }

    getPermanentStatistics() {
        return {
            ...this.permanentStats,
            endingsUnlocked: Array.from(this.permanentStats.endingsUnlocked),
            charactersPlayed: Array.from(this.permanentStats.charactersPlayed),
            locationsDiscovered: Array.from(this.permanentStats.locationsDiscovered),
            eventsEncountered: Array.from(this.permanentStats.eventsEncountered),
            achievementsUnlocked: Array.from(this.permanentStats.achievementsUnlocked),
            totalPlayTimeFormatted: this.formatPlayTime(this.permanentStats.totalPlayTime),
            averageGameLength: this.permanentStats.totalGamesPlayed > 0 ? 
                this.formatPlayTime(this.permanentStats.totalPlayTime / this.permanentStats.totalGamesPlayed) : '0:00'
        };
    }

    formatPlayTime(milliseconds) {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    // Get completion percentage
    getCompletionPercentage(totalEndings = 3, totalCharacters = 4, totalLocations = 9) {
        const endingCompletion = (this.permanentStats.endingsUnlocked.size / totalEndings) * 100;
        const characterCompletion = (this.permanentStats.charactersPlayed.size / totalCharacters) * 100;
        const locationCompletion = (this.permanentStats.locationsDiscovered.size / totalLocations) * 100;
        
        return {
            overall: (endingCompletion + characterCompletion + locationCompletion) / 3,
            endings: endingCompletion,
            characters: characterCompletion,
            locations: locationCompletion
        };
    }

    // Milestone tracking
    addMilestone(description, data = {}) {
        this.milestones.push({
            description,
            timestamp: Date.now(),
            data
        });
    }

    // Reset statistics
    resetSessionStats() {
        this.sessionStats = this.initializeSessionStats();
    }

    resetPermanentStats() {
        this.permanentStats = this.initializePermanentStats();
        try {
            localStorage.removeItem('troubles_simulator_permanent_stats');
        } catch (error) {
            console.warn('Failed to clear permanent stats:', error);
        }
    }

    // Export statistics
    exportStatistics() {
        return {
            session: this.getSessionStatistics(),
            permanent: this.getPermanentStatistics(),
            achievements: Array.from(this.achievements),
            milestones: this.milestones,
            exportDate: new Date().toISOString()
        };
    }
}