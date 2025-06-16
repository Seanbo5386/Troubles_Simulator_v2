export class DataLoader {
    constructor() {
        this.cache = new Map();
        this.baseDataPath = './data/';
    }

    async loadJSON(filename) {
        // Check cache first
        if (this.cache.has(filename)) {
            return this.cache.get(filename);
        }

        try {
            const response = await fetch(`${this.baseDataPath}${filename}`);
            if (!response.ok) {
                throw new Error(`Failed to load ${filename}: ${response.status}`);
            }
            
            const data = await response.json();
            this.cache.set(filename, data);
            return data;
        } catch (error) {
            console.error(`Error loading ${filename}:`, error);
            throw error;
        }
    }

    async loadAllData() {
        try {
            const [
                storyGraph,
                characters,
                locations,
                dialogueTrees,
                events,
                items,
                endings
            ] = await Promise.all([
                this.loadJSON('story-graph.json'),
                this.loadJSON('characters.json'),
                this.loadJSON('locations.json'),
                this.loadJSON('dialogue-trees.json'),
                this.loadJSON('events.json'),
                this.loadOptionalJSON('items.json'),
                this.loadOptionalJSON('endings.json')
            ]);

            if (endings) {
                if (endings.nodes) {
                    storyGraph.nodes = { ...storyGraph.nodes, ...endings.nodes };
                } else {
                    storyGraph.nodes = { ...storyGraph.nodes, ...endings };
                }
            }

            return {
                storyGraph,
                characters,
                locations,
                dialogueTrees,
                events,
                items: items || this.getDefaultItems()
            };
        } catch (error) {
            console.error('Failed to load game data:', error);
            throw error;
        }
    }

    async loadOptionalJSON(filename) {
        try {
            return await this.loadJSON(filename);
        } catch (error) {
            console.warn(`Optional file ${filename} not found, using defaults`);
            return null;
        }
    }

    getDefaultItems() {
        return {
            "press_pass": {
                "id": "press_pass",
                "name": "Press Pass",
                "description": "Official journalist credentials that may help in tense situations",
                "type": "document",
                "effects": {
                    "factionReputation": {
                        "british_army": 1
                    }
                },
                "usable": true,
                "consumable": false
            },
            "notebook": {
                "id": "notebook", 
                "name": "Reporter's Notebook",
                "description": "A worn notebook filled with observations and contacts",
                "type": "tool",
                "effects": {},
                "usable": false,
                "consumable": false
            },
            "government_id": {
                "id": "government_id",
                "name": "Government ID",
                "description": "Civil service identification card",
                "type": "document",
                "effects": {
                    "factionReputation": {
                        "british_army": 2
                    }
                },
                "usable": true,
                "consumable": false
            },
            "coded_message": {
                "id": "coded_message",
                "name": "Coded Message",
                "description": "An encrypted note with strategic information",
                "type": "document",
                "effects": {
                    "tension": -3,
                    "morale": 5
                },
                "usable": true,
                "consumable": true
            },
            "fake_id": {
                "id": "fake_id",
                "name": "Fake ID",
                "description": "Forged identification documents",
                "type": "document",
                "effects": {
                    "tension": -5
                },
                "usable": true,
                "consumable": false,
                "risk": "If discovered, increases all faction suspicion significantly"
            },
            "first_aid_kit": {
                "id": "first_aid_kit",
                "name": "First Aid Kit",
                "description": "Basic medical supplies for treating injuries",
                "type": "medical",
                "effects": {
                    "morale": 10,
                    "ptsd": -5
                },
                "usable": true,
                "consumable": true
            },
            "old_photograph": {
                "id": "old_photograph",
                "name": "Family Photograph",
                "description": "A faded photo of happier times",
                "type": "personal",
                "effects": {
                    "morale": 5,
                    "tension": -2
                },
                "usable": true,
                "consumable": false
            }
        };
    }


    clearCache() {
        this.cache.clear();
    }

    // Preload assets like images and audio
    async preloadAssets(locations) {
        const imagePromises = [];
        const audioPromises = [];

        Object.values(locations).forEach(location => {
            if (location.backgroundImage) {
                imagePromises.push(this.preloadImage(location.backgroundImage));
            }
            if (location.ambientSound) {
                audioPromises.push(this.preloadAudio(location.ambientSound));
            }
        });

        try {
            await Promise.allSettled([...imagePromises, ...audioPromises]);
            console.log('Assets preloaded successfully');
        } catch (error) {
            console.warn('Some assets failed to preload:', error);
        }
    }

    preloadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = resolve;
            img.onerror = reject;
            img.src = src;
        });
    }

    preloadAudio(src) {
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            audio.oncanplaythrough = resolve;
            audio.onerror = reject;
            audio.src = src;
        });
    }
}