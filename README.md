# Kwak

A 2D single-player casual roguelike game built with Phaser 3, TypeScript, and Vite.

## Features

- **Procedural Room Generation**: Explore randomly generated rooms each playthrough
- **Fragment Collection**: Collect 4 fragments scattered across the dungeon
- **Treasure System**: Unlock the treasure by collecting all fragments
- **Enemy AI**: Avoid or dodge enemies with simple but effective AI
- **Meta-Progress**: Track your stats across games with localStorage
- **Simple Graphics**: Clean shape-based visuals, no sprites needed

## Tech Stack

- **Phaser 3**: Game framework
- **TypeScript**: Strict mode enabled
- **Vite**: Fast build tool and dev server
- **ESLint & Prettier**: Code quality and formatting

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

### Build

```bash
npm run build
```

### Lint

```bash
npm run lint
```

### Format

```bash
npm run format
```

## How to Play

- **Movement**: Use arrow keys to move your character (green circle)
- **Objective**: Collect all 4 fragments (yellow circles) to unlock the treasure (gold circle)
- **Enemies**: Avoid red enemies that patrol the rooms
- **Health**: You have 1000 health points. Each enemy hit deals 10 damage with a 2-second cooldown
- **Win Condition**: Collect all fragments and touch the unlocked treasure
- **Lose Condition**: Health reaches 0

## Project Structure

```
src/
├── config/          # Game configuration
├── core/            # Core game systems
├── entities/        # Game entities (Player, Enemy, Collectibles)
├── scenes/          # Phaser scenes (Boot, Preload, Menu, Game, UI, GameOver)
├── systems/         # Game systems (Room generation)
├── ui/              # UI components
├── utils/           # Utility functions (Progress manager)
└── main.ts          # Entry point
```

## License

ISC
