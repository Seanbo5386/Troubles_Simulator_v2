# Troubles Simulator v2

A comprehensive, immersive narrative game exploring the complex moral landscape of The Troubles in Northern Ireland. This fully refactored version transforms the original HTML/JS implementation into a sophisticated branching narrative experience.

## 🎮 Features

### **Story Engine & Data**
- **Generic Story Graph Structure**: All narrative content externalized into JSON files
- **Dynamic Story Nodes**: Support for multiple node types (story, character selection, location hub, endings)
- **Branching Narratives**: Complex choice trees with conditional paths
- **Three Distinct Endings**: Exile, Martyr, and Survivor paths based on player choices

### **Enhanced Dialogue & NPCs**
- **Full Dialogue Trees**: Rich, branching conversations with multiple response options
- **Faction Reputation System**: Dynamic relationships with IRA, UDA, British Army, and Civilians
- **Personal Relationship System**: Individual NPCs track how much they like or dislike you
- **Character-driven Interactions**: Each NPC has unique dialogue trees and story relevance

### **Violence & Consequences**
- **Mature Content**: Optional graphic events with descriptive text (bombing aftermath, sectarian violence)
- **PTSD Mechanics**: Psychological trauma system that accumulates based on witnessed violence
- **Moral Complexity**: Difficult choices with lasting consequences on character and story

### **Modern UI/UX**
- **Glass Panel Design**: Beautiful, atmospheric interface with backdrop blur effects
- **Animated Progress Bars**: Visual feedback for tension, morale, and PTSD levels
 - **Interactive Journal**: Persistent log of major choices with a new "fog of war" effect that mirrors the character's mental state
- **Responsive Design**: Optimized for desktop and mobile devices

### **Visual & Audio Atmosphere**
- **Location-based Backgrounds**: Dynamic background images for each area
- **Ambient Audio System**: Looping soundscapes (rain, distant gunfire, pub chatter)
- **Audio Management**: Comprehensive volume controls and crossfading
- **Visual Effects**: Vignette overlay and smooth transitions between locations

### **Save/Load & Statistics**
- **localStorage Integration**: Persistent game saves with multiple slots
- **Comprehensive Analytics**: Track choices, locations visited, NPCs met, events witnessed
- **Achievement System**: Unlock achievements based on gameplay patterns
- **End-game Statistics**: Detailed breakdown of player journey and final outcomes

### **Accessibility & Internationalization**
- **Keyboard Navigation**: Full keyboard-only control support
- **Screen Reader Support**: ARIA labels and semantic HTML structure
- **High Contrast Mode**: Accessibility option for visually impaired users
- **i18n Framework**: Ready for multiple language support with JSON-based translations

## 🏗️ Architecture

### **ES6 Module System**
```
js/
├── main.js                 # Application entry point
└── modules/
    ├── GameEngine.js       # Core game logic and state management
    ├── StoryManager.js     # Story graph navigation and processing
    ├── UIRenderer.js       # DOM manipulation and visual feedback
    ├── AudioManager.js     # Sound and music management
    ├── SaveManager.js      # Persistent storage and game saves
    ├── EventManager.js     # Random events and moral dilemmas
    ├── StatsManager.js     # Achievement and analytics tracking
    ├── DataLoader.js       # JSON data loading and caching
    └── i18n.js            # Internationalization framework
```

### **Data Structure**
```
data/
├── story-graph.json       # Main narrative structure and nodes
├── characters.json        # Player character definitions and stats
├── locations.json         # Game world locations and connections
├── dialogue-trees.json    # NPC dialogue and interaction trees
└── events.json           # Violence, moral dilemmas, and encounters
```

## 🎯 Gameplay Systems

### **Character Stats**
- **Tension**: Stress level that increases with dangerous situations
- **Morale**: Mental resilience and hope for the future
- **PTSD**: Trauma accumulation from witnessing or participating in violence

### **Faction Relationships**
- **IRA**: Republican paramilitary organization
- **UDA**: Loyalist paramilitary organization  
- **British Army**: Military occupation forces
- **Civilians**: Local population caught in the conflict

### **Choice Consequences**
- Immediate stat changes (tension, morale, PTSD)
- Faction reputation shifts
- Inventory additions/removals
- Story flag changes for future choices
- Location accessibility modifications

## 🚀 Getting Started

1. **Start the Server**: Run `start_server.sh` on Linux/macOS or `start_server.bat` on Windows. The script tries Node.js first and falls back to Python.
2. **Open the Game**: Your default browser should open automatically at `http://localhost:8080`. If not, open that address manually.
3. **Character Selection**: Choose your background (affects starting stats and story access)
4. **Navigate**: Use clickable choices or keyboard shortcuts
5. **Survive**: Balance tension, maintain morale, and make difficult choices
6. **Multiple Playthroughs**: Discover different endings and unlock achievements

## ⌨️ Controls

- **Mouse**: Click choices and UI elements
- **Keyboard**: Full navigation support
- **Ctrl+S**: Quick save
- **Ctrl+L**: Quick load
- **F1**: Help menu
- **Escape**: Close modals

## 🎨 Technical Highlights

### **Modern Web Standards**
- ES6+ JavaScript modules
- CSS Grid and Flexbox layouts
- Web Audio API integration
- Local Storage for persistence
- Responsive design principles

### **Performance Optimizations**
- Lazy loading of audio assets
- Efficient DOM manipulation
- Caching of frequently accessed data
- Smooth animations with CSS transitions

### **Code Quality**
- Modular architecture with clear separation of concerns
- Comprehensive error handling and fallbacks
- Extensive logging for debugging
- Type validation for save data integrity

## 🏆 Achievements

- **First Steps**: Complete your first playthrough
- **Decision Maker**: Make 50+ choices in a single game
- **Hero/Survivor**: Demonstrate consistent moral patterns
- **Explorer**: Visit all available locations
- **Witness**: Experience multiple violent events
- **All Paths**: Unlock all three endings
- **Veteran**: Complete 10+ full playthroughs

## 📝 Development Notes

This refactored version maintains the historical sensitivity of the original while adding:

- **Enhanced Narrative Depth**: More complex storytelling with meaningful choices
- **Technical Sophistication**: Modern web development practices and architecture
- **Accessibility Compliance**: Full keyboard navigation and screen reader support
- **Extensibility**: Modular design allows easy addition of new content
- **Data-Driven Design**: All content externalized for easy modification

## ⚠️ Content Warning

This game depicts fictional situations inspired by real historical events of The Troubles in Northern Ireland (1960s-1990s). While not intended to trivialize the suffering caused during this period, the game contains mature themes including:

- Political violence and terrorism
- Sectarian conflict and discrimination  
- Psychological trauma and its effects
- Moral ambiguity in conflict situations

The game encourages reflection on the difficult choices faced by ordinary people during extraordinary circumstances.

## 🤝 Contributing

The modular architecture makes it easy to contribute:

- **Story Content**: Add nodes to `story-graph.json`
- **Characters**: Extend `characters.json` with new backgrounds
- **Locations**: Create new areas in `locations.json`
- **Events**: Design moral dilemmas in `events.json`
- **Translations**: Add language files to `locales/`

---

*Built with modern web technologies to honor the complexity of history while providing an engaging, educational experience.*