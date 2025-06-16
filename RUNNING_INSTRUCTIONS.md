# Running the Troubles Simulator

## Quick Start

The server is already running! Simply open your web browser and navigate to:

**http://localhost:8080**

## What You'll See

1. **Loading Screen**: The game will initialize all modules
2. **Introduction**: Historical context and content warning
3. **Character Selection**: Choose your background (Catholic teen, Protestant civil servant, Foreign reporter, or IRA volunteer)
4. **Gameplay**: Navigate through Belfast making crucial choices

## Controls

- **Mouse**: Click on choice buttons to make decisions
- **Keyboard**: Use Tab to navigate, Enter/Space to select
- **Ctrl+S**: Quick save
- **Ctrl+L**: Quick load
- **F1**: Help menu
- **Escape**: Close modals

## Game Features

- **Stats**: Monitor tension, morale, and PTSD levels
- **Factions**: Track relationships with IRA, UDA, British Army, and Civilians
- **Journal**: View your choices and interactions in the sidebar
- **Inventory**: Collect and use items you find
- **Multiple Endings**: Exile, Martyr, or Survivor based on your choices

## Technical Notes

- The game uses ES6 modules, which require a web server to run
- Audio and images will show placeholders until you add actual assets
- All progress is saved in your browser's localStorage
- The game is fully responsive and works on mobile devices

## Stopping the Server

When you're done playing:
1. Go back to your terminal/command prompt
2. Press **Ctrl+C** to stop the server

## Adding Assets (Optional)

To enhance the experience:
1. Add background images to `assets/images/`
2. Add ambient audio files to `assets/audio/`
3. File names are specified in `data/locations.json`

## Troubleshooting

- **Server won't start**: Try a different port by editing `server.js`
- **Game won't load**: Check browser console for errors (F12)
- **Audio issues**: Some browsers require user interaction before playing audio
- **Save issues**: Clear browser data if save/load isn't working

---

**Enjoy exploring the complex moral landscape of The Troubles!**