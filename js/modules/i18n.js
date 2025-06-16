class I18n {
    constructor() {
        this.currentLanguage = 'en';
        this.translations = {};
        this.fallbackLanguage = 'en';
        this.initialized = false;
    }

    async init(language = null) {
        // Detect language preference
        this.currentLanguage = language || 
                              localStorage.getItem('troubles_simulator_language') || 
                              this.detectBrowserLanguage() || 
                              'en';

        try {
            await this.loadTranslations(this.currentLanguage);
            this.updateDOM();
            this.initialized = true;
            console.log(`i18n initialized with language: ${this.currentLanguage}`);
        } catch (error) {
            console.warn(`Failed to load language ${this.currentLanguage}, falling back to ${this.fallbackLanguage}`);
            await this.loadTranslations(this.fallbackLanguage);
            this.currentLanguage = this.fallbackLanguage;
            this.updateDOM();
            this.initialized = true;
        }
    }

    detectBrowserLanguage() {
        const browserLang = navigator.language || navigator.userLanguage;
        return browserLang.split('-')[0]; // Get just the language code (e.g., 'en' from 'en-US')
    }

    async loadTranslations(language) {
        try {
            const response = await fetch(`./locales/${language}.json`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            this.translations[language] = await response.json();
        } catch (error) {
            if (language !== this.fallbackLanguage) {
                console.warn(`Failed to load ${language} translations, using built-in English`);
                this.translations[language] = this.getBuiltInTranslations();
            } else {
                throw error;
            }
        }
    }

    getBuiltInTranslations() {
        return {
            // UI Elements
            "prompt": ">",
            "submit": "Enter",
            "input_placeholder": "What do you do?",
            "loading": "Loading...",
            "save_game": "Save Game",
            "load_game": "Load Game",
            "restart": "Restart",
            "settings": "Settings",
            "close": "Close",
            "play_again": "Play Again",
            "view_journal": "View Journal",
            
            // Status Panel
            "status": "Status",
            "tension": "Tension",
            "morale": "Morale",
            "ptsd": "PTSD",
            "faction_rep": "Faction Relations",
            "npc_rel": "NPC Relations",
            "inventory": "Inventory",
            "actions": "Actions",
            "empty": "(empty)",
            
            // Journal
            "journal": "Journal",
            "character_info": "Character",
            "location": "Location",
            "statistics": "Statistics",
            "choices_made": "Choices Made",
            "locations_visited": "Locations Visited",
            "npcs_met": "NPCs Met",
            "events_witnessed": "Events Witnessed",
            
            // Settings
            "master_volume": "Master Volume",
            "ambient_volume": "Ambient Volume",
            "text_speed": "Text Speed",
            "accessibility_mode": "High Contrast Mode",
            "fast": "Fast",
            "medium": "Medium",
            "slow": "Slow",
            
            // Game Messages
            "game_saved": "Game saved successfully!",
            "game_loaded": "Game loaded successfully!",
            "no_save_data": "No save data found.",
            "save_failed": "Failed to save game.",
            "load_failed": "Failed to load game.",
            "restart_confirm": "Are you sure you want to restart? All progress will be lost.",
            
            // Character Backgrounds
            "catholic_teen_desc": "Catholic teen from Belfast - Growing up on the Falls Road, you've learned to keep your head down and your mouth shut.",
            "protestant_civil_desc": "Protestant civil servant - Your job at the city council has given you a unique perspective on the bureaucracy of conflict.",
            "foreign_reporter_desc": "Foreign reporter - Armed with a press pass and an outsider's perspective, you've come to document the human cost.",
            "ira_volunteer_desc": "IRA volunteer lying low - The safe house feels less safe each day, and every knock could be your last.",
            
            // Locations
            "falls_road": "Falls Road",
            "peace_line": "Peace Line",
            "shankill_road": "Shankill Road",
            "countryside_safehouse": "Countryside Safehouse",
            "local_pub": "Local Pub",
            "belfast_city_centre": "Belfast City Centre",
            "bombed_factory": "Bombed Factory",
            "military_checkpoint": "Military Checkpoint",
            "border_crossing": "Border Crossing",
            
            // NPCs
            "local_resident": "Local Resident",
            "ira_sympathizer": "Republican Sympathizer",
            "british_soldier": "British Soldier",
            "uda_member": "UDA Member",
            "bartender": "Pub Owner",
            "informant": "Informant",
            "journalist": "Journalist",
            "police_officer": "Police Officer",
            
            // Actions
            "look_around": "Look Around",
            "search_area": "Search the area",
            "rest_recover": "Rest and recover",
            "talk_to": "Talk to",
            "go_to": "Go to",
            "use_item": "Use",
            
            // Faction Names
            "ira": "IRA",
            "uda": "UDA",
            "british_army": "British Army",
            "civilians": "Civilians",
            
            // Reputation Levels
            "trusted": "Trusted",
            "liked": "Liked",
            "neutral": "Neutral",
            "disliked": "Disliked",
            "hostile": "Hostile",
            
            // Items
            "press_pass": "Press Pass",
            "notebook": "Reporter's Notebook",
            "government_id": "Government ID",
            "coded_message": "Coded Message",
            "fake_id": "Fake ID",
            "first_aid_kit": "First Aid Kit",
            "old_photograph": "Family Photograph",
            
            // Endings
            "ending_exile": "The Exile",
            "ending_martyr": "The Martyr",
            "ending_survivor": "The Survivor",
            
            // Achievements
            "achievement_first_game": "First Steps",
            "achievement_decision_maker": "Decision Maker",
            "achievement_hero": "Hero",
            "achievement_survivor": "Survivor",
            "achievement_explorer": "Explorer",
            "achievement_witness": "Witness",
            "achievement_on_the_edge": "On the Edge",
            "achievement_optimist": "Optimist",
            "achievement_all_endings": "All Paths",
            "achievement_versatile": "Versatile",
            "achievement_dedicated": "Dedicated",
            "achievement_veteran": "Veteran",
            
            // Help Text
            "help_title": "How to Play",
            "help_choices": "Make choices by clicking on the available options",
            "help_stats": "Monitor your tension, morale, and PTSD levels",
            "help_factions": "Keep track of your relationships with different factions",
            "help_inventory": "Use items from your inventory when appropriate",
            "help_consequences": "Your choices have consequences - choose wisely",
            "help_shortcuts": "Keyboard Shortcuts",
            "help_save": "Ctrl+S: Save game",
            "help_load": "Ctrl+L: Load game",
            "help_help": "F1: Show this help",
            "help_escape": "Escape: Close modals",
            
            // Time Formats
            "time_seconds": "seconds",
            "time_minutes": "minutes",
            "time_hours": "hours",
            "time_days": "days",
            
            // Common Words
            "yes": "Yes",
            "no": "No",
            "continue": "Continue",
            "back": "Back",
            "next": "Next",
            "previous": "Previous",
            "cancel": "Cancel",
            "confirm": "Confirm",
            "warning": "Warning",
            "error": "Error",
            "success": "Success",
            "info": "Information"
        };
    }

    // Get translated text
    t(key, params = {}) {
        if (!this.initialized) {
            console.warn('i18n not initialized, returning key');
            return key;
        }

        let translation = this.translations[this.currentLanguage]?.[key];
        
        // Fall back to English if translation not found
        if (!translation && this.currentLanguage !== this.fallbackLanguage) {
            translation = this.translations[this.fallbackLanguage]?.[key];
        }
        
        // Fall back to key if still not found
        if (!translation) {
            console.warn(`Translation missing for key: ${key}`);
            return key;
        }

        // Handle parameters/interpolation
        return this.interpolate(translation, params);
    }

    // Interpolate parameters into translation string
    interpolate(text, params) {
        if (!params || Object.keys(params).length === 0) {
            return text;
        }

        return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return params[key] !== undefined ? params[key] : match;
        });
    }

    // Pluralization helper
    plural(key, count, params = {}) {
        const pluralKey = count === 1 ? `${key}_singular` : `${key}_plural`;
        return this.t(pluralKey, { ...params, count });
    }

    // Change language
    async changeLanguage(language) {
        if (language === this.currentLanguage) {
            return;
        }

        try {
            await this.loadTranslations(language);
            this.currentLanguage = language;
            localStorage.setItem('troubles_simulator_language', language);
            this.updateDOM();
            console.log(`Language changed to: ${language}`);
            
            // Dispatch event for other components to react
            document.dispatchEvent(new CustomEvent('languageChanged', {
                detail: { language }
            }));
        } catch (error) {
            console.error(`Failed to change language to ${language}:`, error);
            throw error;
        }
    }

    // Update DOM elements with data-i18n attributes
    updateDOM() {
        // Update text content
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            element.textContent = this.t(key);
        });

        // Update placeholders
        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            element.placeholder = this.t(key);
        });

        // Update titles
        document.querySelectorAll('[data-i18n-title]').forEach(element => {
            const key = element.getAttribute('data-i18n-title');
            element.title = this.t(key);
        });

        // Update aria-labels
        document.querySelectorAll('[data-i18n-aria-label]').forEach(element => {
            const key = element.getAttribute('data-i18n-aria-label');
            element.setAttribute('aria-label', this.t(key));
        });
    }

    // Get available languages
    getAvailableLanguages() {
        return [
            { code: 'en', name: 'English', nativeName: 'English' },
            { code: 'ga', name: 'Irish', nativeName: 'Gaeilge' },
            { code: 'fr', name: 'French', nativeName: 'Français' },
            { code: 'es', name: 'Spanish', nativeName: 'Español' },
            { code: 'de', name: 'German', nativeName: 'Deutsch' }
        ];
    }

    // Get current language info
    getCurrentLanguage() {
        const languages = this.getAvailableLanguages();
        return languages.find(lang => lang.code === this.currentLanguage) || languages[0];
    }

    // Format numbers according to locale
    formatNumber(number, options = {}) {
        try {
            return new Intl.NumberFormat(this.currentLanguage, options).format(number);
        } catch (error) {
            return number.toString();
        }
    }

    // Format dates according to locale
    formatDate(date, options = {}) {
        try {
            return new Intl.DateTimeFormat(this.currentLanguage, options).format(date);
        } catch (error) {
            return date.toLocaleDateString();
        }
    }

    // Format relative time (e.g., "2 hours ago")
    formatRelativeTime(date) {
        try {
            const rtf = new Intl.RelativeTimeFormat(this.currentLanguage, { numeric: 'auto' });
            const diff = date - new Date();
            const seconds = Math.floor(diff / 1000);
            const minutes = Math.floor(seconds / 60);
            const hours = Math.floor(minutes / 60);
            const days = Math.floor(hours / 24);

            if (Math.abs(days) > 0) {
                return rtf.format(days, 'day');
            } else if (Math.abs(hours) > 0) {
                return rtf.format(hours, 'hour');
            } else if (Math.abs(minutes) > 0) {
                return rtf.format(minutes, 'minute');
            } else {
                return rtf.format(seconds, 'second');
            }
        } catch (error) {
            return date.toLocaleString();
        }
    }

    // Get text direction for current language
    getTextDirection() {
        // Add RTL languages as needed
        const rtlLanguages = ['ar', 'he', 'fa'];
        return rtlLanguages.includes(this.currentLanguage) ? 'rtl' : 'ltr';
    }

    // Cleanup
    destroy() {
        this.translations = {};
        this.initialized = false;
    }
}

// Create singleton instance
export const i18n = new I18n();