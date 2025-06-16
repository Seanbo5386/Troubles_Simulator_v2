export class DataLoader {
    constructor() {
        this.cache = new Map();
        this.baseDataPath = './data/';
    }

    applyAssetPaths(locations) {
        Object.values(locations).forEach(loc => {
            if (!loc.backgroundImage && loc.originalBackgroundImage) {
                loc.backgroundImage = loc.originalBackgroundImage;
            }
            if (!loc.ambientSound && loc.originalAmbientSound) {
                loc.ambientSound = loc.originalAmbientSound;
            }
        });
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
                this.loadJSON('items.json'),
                this.loadJSON('endings.json')
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
                items
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