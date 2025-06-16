import { GameEngine } from './modules/GameEngine.js';
import { DataLoader } from './modules/DataLoader.js';
import { i18n } from './modules/i18n.js';

class TroublesSimulator {
    constructor() {
        this.gameEngine = null;
        this.dataLoader = new DataLoader();
        this.isLoading = true;
    }

    async init() {
        try {
            this.showLoadingScreen();
            
            // Initialize i18n
            await i18n.init();
            
            // Load all game data
            const gameData = await this.dataLoader.loadAllData();

            // Preload assets like images and audio
            try {
                await this.dataLoader.preloadAssets(gameData.locations);
            } catch (preloadError) {
                console.error('Asset preloading failed:', preloadError);
            }

            // Initialize game engine
            this.gameEngine = new GameEngine(gameData);
            
            // Hide loading screen and start game
            this.hideLoadingScreen();
            await this.gameEngine.init();
            
        } catch (error) {
            console.error('Failed to initialize game:', error);
            this.showError('Failed to load game data. Please refresh the page.');
        }
    }

    showLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        loadingScreen.classList.remove('hidden');
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        loadingScreen.classList.add('hidden');
        this.isLoading = false;
    }

    showError(message) {
        const loadingScreen = document.getElementById('loading-screen');
        loadingScreen.innerHTML = `
            <div class="flex items-center justify-center h-screen">
                <div class="text-center text-red-400">
                    <h2 class="text-2xl font-bold mb-4">Error</h2>
                    <p class="mb-4">${message}</p>
                    <button onclick="window.location.reload()" class="control-btn bg-red-600 hover:bg-red-700">
                        Reload Game
                    </button>
                </div>
            </div>
        `;
    }

    // Global event listeners
    setupGlobalEventListeners() {
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (this.isLoading) return;
            
            switch(e.key) {
                case 'Escape':
                    this.gameEngine?.uiRenderer?.closeAllModals();
                    break;
                case 'F1':
                    e.preventDefault();
                    this.gameEngine?.uiRenderer?.showHelp();
                    break;
                case 's':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.gameEngine?.saveManager?.saveGame();
                    }
                    break;
                case 'l':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.gameEngine?.saveManager?.loadGame();
                    }
                    break;
            }
        });

        // Handle visibility change for audio management
        document.addEventListener('visibilitychange', () => {
            if (this.gameEngine?.audioManager) {
                if (document.hidden) {
                    this.gameEngine.audioManager.pauseAll();
                } else {
                    this.gameEngine.audioManager.resumeAll();
                }
            }
        });

        // Handle beforeunload for save prompts
        window.addEventListener('beforeunload', (e) => {
            if (this.gameEngine?.hasUnsavedProgress()) {
                e.preventDefault();
                e.returnValue = 'You have unsaved progress. Are you sure you want to leave?';
                return e.returnValue;
            }
        });
    }
}

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    const game = new TroublesSimulator();
    game.setupGlobalEventListeners();
    await game.init();
});

// Export for global access if needed
window.TroublesSimulator = TroublesSimulator;