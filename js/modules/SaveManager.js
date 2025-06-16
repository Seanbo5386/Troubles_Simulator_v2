export class SaveManager {
    constructor() {
        this.saveKey = 'troubles_simulator_save';
        this.settingsKey = 'troubles_simulator_settings';
        this.maxSaveSlots = 5;
        this.autoSaveInterval = 5 * 60 * 1000; // 5 minutes
        this.autoSaveTimer = null;
    }

    async init() {
        console.log('Save manager initialized');
        this.startAutoSave();
    }

    // Save game state
    save(gameData, slotNumber = 0) {
        if (!this.isLocalStorageAvailable()) {
            console.warn('Local storage not available');
            return false;
        }

        try {
            const saveData = {
                ...gameData,
                version: '1.0.0',
                timestamp: Date.now(),
                slotNumber
            };

            const saveKey = slotNumber === 0 ? this.saveKey : `${this.saveKey}_slot_${slotNumber}`;
            localStorage.setItem(saveKey, JSON.stringify(saveData));
            
            console.log(`Game saved to slot ${slotNumber}`);
            return true;
        } catch (error) {
            console.error('Failed to save game:', error);
            return false;
        }
    }

    // Load game state
    load(slotNumber = 0) {
        if (!this.isLocalStorageAvailable()) {
            console.warn('Local storage not available');
            return null;
        }

        try {
            const saveKey = slotNumber === 0 ? this.saveKey : `${this.saveKey}_slot_${slotNumber}`;
            const saveData = localStorage.getItem(saveKey);
            
            if (!saveData) {
                return null;
            }

            const parsedData = JSON.parse(saveData);
            
            // Validate save data
            if (!this.validateSaveData(parsedData)) {
                console.warn('Invalid save data');
                return null;
            }

            console.log(`Game loaded from slot ${slotNumber}`);
            return parsedData;
        } catch (error) {
            console.error('Failed to load game:', error);
            return null;
        }
    }

    // Get all save slots
    getAllSaves() {
        const saves = [];
        
        for (let i = 0; i <= this.maxSaveSlots; i++) {
            const saveData = this.load(i);
            if (saveData) {
                saves.push({
                    slotNumber: i,
                    timestamp: saveData.timestamp,
                    player: saveData.player,
                    gameStats: saveData.gameStats,
                    preview: this.generateSavePreview(saveData)
                });
            } else {
                saves.push({
                    slotNumber: i,
                    empty: true
                });
            }
        }
        
        return saves;
    }

    // Generate a preview of save data for UI
    generateSavePreview(saveData) {
        if (!saveData.player) {
            return 'Invalid save data';
        }

        const playTime = saveData.gameStats?.endTime 
            ? saveData.gameStats.endTime - saveData.gameStats.startTime
            : Date.now() - (saveData.gameStats?.startTime || Date.now());
        
        const playTimeMinutes = Math.floor(playTime / 60000);
        
        return {
            characterName: saveData.player.name,
            location: saveData.player.location,
            playTime: playTimeMinutes,
            choicesMade: saveData.gameStats?.choicesMade || 0,
            timestamp: new Date(saveData.timestamp).toLocaleString()
        };
    }

    // Delete a save slot
    deleteSave(slotNumber = 0) {
        if (!this.isLocalStorageAvailable()) {
            return false;
        }

        try {
            const saveKey = slotNumber === 0 ? this.saveKey : `${this.saveKey}_slot_${slotNumber}`;
            localStorage.removeItem(saveKey);
            console.log(`Save slot ${slotNumber} deleted`);
            return true;
        } catch (error) {
            console.error('Failed to delete save:', error);
            return false;
        }
    }

    // Auto-save functionality
    startAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
        }

        this.autoSaveTimer = setInterval(() => {
            // Dispatch auto-save event for game engine to handle
            document.dispatchEvent(new CustomEvent('autoSave'));
        }, this.autoSaveInterval);
    }

    stopAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }
    }

    // Quick save/load (slot 0)
    quickSave(gameData) {
        return this.save(gameData, 0);
    }

    quickLoad() {
        return this.load(0);
    }

    // Export save data as JSON
    exportSave(slotNumber = 0) {
        const saveData = this.load(slotNumber);
        if (!saveData) {
            return null;
        }

        try {
            const exportData = {
                ...saveData,
                exportedAt: Date.now(),
                gameTitle: 'Troubles Simulator'
            };

            return JSON.stringify(exportData, null, 2);
        } catch (error) {
            console.error('Failed to export save:', error);
            return null;
        }
    }

    // Import save data from JSON
    importSave(jsonData, slotNumber = 0) {
        try {
            const importedData = JSON.parse(jsonData);
            
            // Validate imported data
            if (!this.validateSaveData(importedData)) {
                console.warn('Invalid imported save data');
                return false;
            }

            // Remove export metadata
            delete importedData.exportedAt;
            delete importedData.gameTitle;

            return this.save(importedData, slotNumber);
        } catch (error) {
            console.error('Failed to import save:', error);
            return false;
        }
    }

    // Save and load game settings
    saveSettings(settings) {
        if (!this.isLocalStorageAvailable()) {
            return false;
        }

        try {
            localStorage.setItem(this.settingsKey, JSON.stringify(settings));
            return true;
        } catch (error) {
            console.error('Failed to save settings:', error);
            return false;
        }
    }

    loadSettings() {
        if (!this.isLocalStorageAvailable()) {
            return null;
        }

        try {
            const settings = localStorage.getItem(this.settingsKey);
            return settings ? JSON.parse(settings) : null;
        } catch (error) {
            console.error('Failed to load settings:', error);
            return null;
        }
    }

    // Validate save data structure
    validateSaveData(saveData) {
        if (!saveData || typeof saveData !== 'object') {
            return false;
        }

        // Check required fields
        const requiredFields = ['player', 'timestamp'];
        for (const field of requiredFields) {
            if (!(field in saveData)) {
                console.warn(`Missing required field: ${field}`);
                return false;
            }
        }

        // Validate player data
        if (!saveData.player || typeof saveData.player !== 'object') {
            return false;
        }

        const requiredPlayerFields = ['id', 'location', 'stats'];
        for (const field of requiredPlayerFields) {
            if (!(field in saveData.player)) {
                console.warn(`Missing required player field: ${field}`);
                return false;
            }
        }

        // Validate stats
        if (!saveData.player.stats || typeof saveData.player.stats !== 'object') {
            return false;
        }

        return true;
    }

    // Check if local storage is available
    isLocalStorageAvailable() {
        try {
            const test = '__localStorage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            return false;
        }
    }

    // Get storage usage information
    getStorageInfo() {
        if (!this.isLocalStorageAvailable()) {
            return null;
        }

        try {
            let totalSize = 0;
            let gameDataSize = 0;

            for (const key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    const size = localStorage[key].length;
                    totalSize += size;
                    
                    if (key.startsWith('troubles_simulator')) {
                        gameDataSize += size;
                    }
                }
            }

            return {
                totalSize,
                gameDataSize,
                availableSlots: this.maxSaveSlots,
                usedSlots: this.getAllSaves().filter(save => !save.empty).length
            };
        } catch (error) {
            console.error('Failed to get storage info:', error);
            return null;
        }
    }

    // Clear all save data
    clearAllSaves() {
        if (!this.isLocalStorageAvailable()) {
            return false;
        }

        try {
            // Remove all save slots
            for (let i = 0; i <= this.maxSaveSlots; i++) {
                this.deleteSave(i);
            }
            
            // Remove settings
            localStorage.removeItem(this.settingsKey);
            
            console.log('All save data cleared');
            return true;
        } catch (error) {
            console.error('Failed to clear save data:', error);
            return false;
        }
    }

    // Backup and restore functionality
    createBackup() {
        const saves = this.getAllSaves().filter(save => !save.empty);
        const settings = this.loadSettings();
        
        const backup = {
            saves: saves.map(save => this.load(save.slotNumber)),
            settings,
            backupTimestamp: Date.now(),
            version: '1.0.0'
        };

        return JSON.stringify(backup, null, 2);
    }

    restoreFromBackup(backupData) {
        try {
            const backup = JSON.parse(backupData);
            
            if (!backup.saves || !Array.isArray(backup.saves)) {
                throw new Error('Invalid backup format');
            }

            // Restore saves
            backup.saves.forEach((saveData, index) => {
                if (this.validateSaveData(saveData)) {
                    this.save(saveData, index);
                }
            });

            // Restore settings
            if (backup.settings) {
                this.saveSettings(backup.settings);
            }

            console.log('Backup restored successfully');
            return true;
        } catch (error) {
            console.error('Failed to restore backup:', error);
            return false;
        }
    }

    // Migration functionality for save format updates
    migrateSaveData(saveData) {
        // Add migration logic here for future save format changes
        let migratedData = { ...saveData };
        
        // Example migration from version 1.0.0 to 1.1.0
        if (!migratedData.version || migratedData.version === '1.0.0') {
            // Perform migration steps
            migratedData.version = '1.1.0';
        }

        return migratedData;
    }

    // Cleanup old saves based on timestamp
    cleanupOldSaves(maxAge = 30 * 24 * 60 * 60 * 1000) { // 30 days default
        const now = Date.now();
        const saves = this.getAllSaves();
        
        saves.forEach(save => {
            if (!save.empty && save.timestamp && (now - save.timestamp) > maxAge) {
                this.deleteSave(save.slotNumber);
                console.log(`Cleaned up old save from slot ${save.slotNumber}`);
            }
        });
    }

    // Cleanup method
    destroy() {
        this.stopAutoSave();
    }
}