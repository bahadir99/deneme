# Story Management System

A comprehensive interactive story creation and management tool built with Tauri, allowing users to create branching narrative stories with character management, inventory systems, and conditional content.

## Features

### Story Creation
- **Scene Management**: Create and organize scenes with titles and text content
- **Branching Choices**: Add multiple choices to scenes that lead to different paths
- **Conditional Content**: Set conditions for scenes and choices to control when they're available
- **Effects System**: Apply variable changes and inventory item effects when choices are selected

### Character System
- **Player Character**: Built-in player character with full trait/skill support
- **Character Creation**: Create multiple characters with:
  - Name, gender, and biological gender
  - Custom tags
  - Traits and skills assignment
  - Custom variable values
- **Character Variables**: Define template variables that all characters inherit
- **Trait Mechanics**: Create traits/skills that automatically affect character variables

### Inventory System
- **Item Management**: Create items with:
  - Name, description, category
  - Type (equippable, consumable, misc)
  - Rarity levels
  - Stackable properties
  - Equipment slots
- **Equipment Slots**: Define custom equipment slots with capacity limits
- **Inventory Assignment**: Assign items to player or characters
- **Equip/Unequip**: Manage equipped items with visual feedback

### Choice Effects
- **Variable Effects**: Modify global, character, or player variables
  - Operations: Set, Add, Subtract
  - Supports formulas and expressions
- **Inventory Effects**: Give or remove items from player/characters
  - Select target (player or specific character)
  - Specify quantity
  - Operations: Give, Remove

### Global Variables
- Manage story-wide variables that persist across scenes
- Use in conditions and effects

## Installation

### Prerequisites
- Node.js (v16 or higher)
- Rust (latest stable)
- Tauri CLI

### Setup
```bash
# Install dependencies
npm install

# Run in development mode
npm run tauri dev

# Build for production
npm run tauri build
```

## Usage

### Creating a Story

1. **Start a New Story**
   - Click "Create New Story" from the main menu
   - Enter a story title
   - Start adding scenes

2. **Add Scenes**
   - Click "Add Scene" in the sidebar
   - Enter scene title and text content
   - Add conditions if the scene should be conditional

3. **Add Choices**
   - Select a scene
   - Click "Add Choice"
   - Enter choice text
   - Set target scene (or leave empty for story end)
   - Add conditions and effects as needed

4. **Create Characters**
   - Switch to Characters tab
   - Click "Add Character"
   - Fill in character details
   - Assign traits and set variable values

5. **Configure Inventory**
   - Switch to Inventory tab
   - Set inventory mode (disabled, player only, or all characters)
   - Create equipment slots
   - Create items
   - Assign items to holders

### Playing a Story

1. Click "Play a Story" from main menu
2. Select a story from the list
3. Navigate through scenes by clicking choices
4. View inventory in the sidebar
5. Story state persists as you make choices

## Story JSON Structure

Stories are saved as JSON files with the following structure:

```json
{
  "scenes": [
    {
      "title": "Scene Title",
      "text": "Scene content...",
      "conditions": {...},
      "choices": [
        {
          "text": "Choice text",
          "target": 1,
          "conditions": {...},
          "effects": [
            {
              "type": "variable",
              "scope": "global",
              "variable": "health",
              "operation": "add",
              "value": "10"
            },
            {
              "type": "inventory",
              "scope": "player",
              "operation": "give",
              "itemId": 12345,
              "quantity": 1
            }
          ]
        }
      ]
    }
  ],
  "characters": [
    {
      "name": "Character Name",
      "gender": "Male",
      "bioGender": "Male",
      "tags": ["tag1", "tag2"],
      "traits": ["Strong", "Fast"],
      "variableValues": {
        "health": 100,
        "strength": 10
      }
    }
  ],
  "playerData": {
    "name": "Player",
    "traits": ["trait1"],
    "variableValues": {
      "health": 100
    }
  },
  "globalVariables": [
    {
      "name": "storyFlag",
      "value": true
    }
  ],
  "characterVariablesTemplate": [
    {
      "name": "health",
      "type": "integer",
      "defaultValue": 100
    }
  ],
  "traitMechanics": [
    {
      "trait": "Strong",
      "description": "Increases strength",
      "active": true,
      "effects": [
        {
          "variable": "strength",
          "formula": "+5"
        }
      ]
    }
  ],
  "inventoryMode": "all",
  "inventoryEquipSlots": [
    {
      "id": 1,
      "name": "Weapon",
      "capacity": 2
    }
  ],
  "inventoryItems": [
    {
      "id": 12345,
      "name": "Sword",
      "category": "Weapons",
      "type": "equippable",
      "slot": "Weapon",
      "rarity": "rare",
      "description": "A sharp sword",
      "stackable": false,
      "maxStack": 1
    }
  ],
  "inventoryAssignments": {
    "player": [
      {
        "id": 12345,
        "equipped": false,
        "quantity": 1
      }
    ]
  }
}
```

### Key Structures

**Scene:**
- `title`: Scene title (optional)
- `text`: Scene content text
- `conditions`: Condition object (optional)
- `choices`: Array of choice objects

**Choice:**
- `text`: Choice text displayed to player
- `target`: Scene index (number) or null (end story)
- `conditions`: Condition object (optional)
- `effects`: Array of effect objects (optional)

**Effect Types:**

1. **Variable Effect:**
   - `type`: "variable"
   - `scope`: "global" | "character" | "player"
   - `characterId`: Number (if scope is "character")
   - `variable`: Variable name (string)
   - `operation`: "set" | "add" | "subtract"
   - `value`: Value or formula (string)

2. **Inventory Effect:**
   - `type`: "inventory"
   - `scope`: "player" | "character"
   - `characterId`: Number (if scope is "character")
   - `operation`: "give" | "remove"
   - `itemId`: Item ID (number)
   - `quantity`: Quantity (number)

**Character:**
- `name`: Character name
- `gender`: Gender identity
- `bioGender`: Biological gender
- `tags`: Array of tag strings
- `traits`: Array of trait name strings
- `variableValues`: Object mapping variable names to values

**Inventory Item:**
- `id`: Unique item ID (number)
- `name`: Item name
- `category`: Item category
- `type`: "equippable" | "consumable" | "misc"
- `slot`: Equipment slot name (if equippable)
- `rarity`: "common" | "uncommon" | "rare" | "epic" | "legendary" | "unique"
- `description`: Item description
- `stackable`: Boolean
- `maxStack`: Maximum stack size (number)

## File Structure

```
.
├── src/                    # Frontend source files
│   ├── index.html         # Main menu page
│   ├── create-story.html  # Story editor page
│   ├── player.html        # Story player page
│   ├── main.js            # Main application logic
│   └── styles.css         # Application styles
├── src-tauri/             # Tauri backend
│   ├── src/
│   │   └── lib.rs        # Rust backend code
│   └── Cargo.toml         # Rust dependencies
└── package.json           # Node.js dependencies
```

## Development

### Project Structure
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Backend**: Rust (Tauri)
- **Storage**: JSON files stored in app data directory

### Key Components
- Story editor with scene/choice management
- Character editor with traits and variables
- Inventory management system
- Story player with conditional content
- Effects system for choices

## Notes for Game App Integration

When integrating stories into a game app:

1. **Scenes vs Blocks**: Stories use `scenes` array, but player apps may reference them as `blocks`
2. **Choices vs Selections**: Stories use `choices`, but player apps may reference them as `selections`
3. **Inventory Holders**: Use `"player"` for player inventory, `"character:0"`, `"character:1"`, etc. for character inventories
4. **Effect Execution**: Apply effects when choices are selected, before navigating to target scene
5. **Condition Evaluation**: Evaluate conditions before showing scenes/choices - hide or lock if conditions aren't met

## License

[Add your license here]

## Contributing

[Add contribution guidelines here]
