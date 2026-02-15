# Kwak Visual Style Guide

## Theme
**Pirate Fantasy Dungeon Exploration**

A light adventure roguelike with a pirate-fantasy aesthetic. The visual style emphasizes:
- Adventurous treasure-hunting atmosphere
- Slightly whimsical, colorful presentation
- Readable and accessible design
- Casual, non-threatening mood (avoiding dark horror tones)

## Color Palette

### Primary Colors

| Color Name | Hex | Use Case |
|------------|-----|----------|
| Deep Ocean Blue | `#1F3C88` | Background, ocean theme |
| Tropical Teal | `#008E89` | Interactive elements, accents |
| Sand Beige | `#E6C79C` | Text, floors, parchment |
| Treasure Gold | `#F4B400` | Rewards, fragments, highlights |
| Emerald Green | `#2ECC71` | Player, health (full) |
| Crimson Accent | `#B33939` | Danger, warnings, damage |
| Dark Wood Brown | `#4B2E2B` | Walls, panels, surfaces |

### Semantic Color Usage

```typescript
// Rewards and collectibles
reward: Treasure Gold (#F4B400)
rewardAccent: Emerald Green (#2ECC71)

// UI Elements
background: Deep Ocean Blue (#1F3C88)
surface: Dark Wood Brown (#4B2E2B)
text: Sand Beige (#E6C79C)
accent: Tropical Teal (#008E89)
danger: Crimson Accent (#B33939)

// Game Elements
healthFull: Emerald Green (#2ECC71)
healthLow: Crimson Accent (#B33939)
fragmentCollected: Treasure Gold (#F4B400)
fragmentUncollected: Sand Beige (#E6C79C)
fragmentPurchasable: Tropical Teal (#008E89)

// Environment
wallColor: Dark Wood Brown (#4B2E2B)
floorColor: Sand Beige (#E6C79C)
enemyColor: Muted Purple (#7D3C98)
treasureChest: Treasure Gold (#F4B400)
```

## Typography

### Font Families
- **Headers**: Arial Black (to be replaced with fantasy font when assets added)
- **Body**: Arial (simple sans-serif for clarity)
- **UI**: Arial

### Font Sizes (8px Grid-Based)

| Name | Size | Grid Units | Usage |
|------|------|------------|-------|
| Tiny | 12px | 1.5 | Small labels |
| Small | 14px | 1.75 | UI text, stats |
| Body | 16px | 2 | Main text, descriptions |
| Large | 20px | 2.5 | Instructions, messages |
| Title | 24px | 3 | Section headers |
| Hero | 32px | 4 | Scene titles |
| Mega | 48px | 6 | Main title (small) |
| Giant | 64px | 8 | Main title (large) |

## Spacing System (8px Grid)

All spacing should use multiples of 8px for consistency:

| Name | Value | Usage |
|------|-------|-------|
| xs | 4px | Minimal padding, tight spacing |
| sm | 8px | Small gaps, inner padding |
| md | 16px | Standard spacing, margins |
| lg | 24px | Section spacing |
| xl | 32px | Large gaps, major sections |
| xxl | 48px | Screen margins |
| xxxl | 64px | Major layout spacing |

## UI Components

### Buttons

**Minimum Touch Size**: 48px height (accessibility standard)

**Padding**: 
- Horizontal: 16px
- Vertical: 12px

**States**:
- **Normal**: Dark Wood Brown background, Sand Beige text
- **Hover**: Dark Wood Brown background, Treasure Gold text and outline
- **Pressed**: Darker wood tone (#3a221f), Sand Beige text
- **Disabled**: Muted brown (#6b4e4a), muted beige text (#a08d84)

### Health Bar

- **Width**: 200px
- **Height**: 24px
- **Background**: Dark Wood Brown (80% opacity)
- **Border Radius**: 4px
- **Color**: 
  - Green (>60% health) → Emerald Green
  - Yellow (30-60% health) → Treasure Gold
  - Red (<30% health) → Crimson Accent

### Fragment Indicators

- **Size**: 12px
- **Spacing**: 20px between indicators
- **Shape**: Irregular quadrilateral (torn parchment effect)
- **States**:
  - Uncollected: Sand Beige, 50% opacity
  - Purchasable: Tropical Teal, full opacity
  - Collected: Treasure Gold with glow, "X" mark

**Glow Effect** (for collected):
- Size: 16px
- Alpha: 0.3-0.6 (pulsing)
- Animation: 1000ms cycle, scale 1.0-1.2

### Gold Counter

- Icon: ⚫ (placeholder for coin icon)
- Color: Treasure Gold (#F4B400)
- Background: Dark Wood Brown
- Padding: 8px horizontal, 4px vertical

## HUD Layout

### Top Left
- Health bar at (16px, 16px)
- Gold counter below health bar with 8px spacing

### Top Right
- Fragment tracker text
- Fragment indicators below with 16px vertical spacing
- Indicators arranged horizontally with 20px spacing

### Bottom Left (Future)
- Virtual joystick at 32px from bottom-left corner
- Size: 100px
- Alpha: 0.5 (semi-transparent)

### Bottom Right (Future)
- Action button at 32px from bottom-right corner
- Size: 64px

## Animation

### Timing
- **Fast**: 200ms - Quick state changes
- **Normal**: 400ms - Standard transitions
- **Slow**: 600ms - Emphasis animations

### Easing
- **Default**: Quad.easeOut
- **Smooth**: Sine.easeInOut
- **Bounce**: Bounce.easeOut (for special effects)

### Fragment Animations

**Collection Effect**:
- Glow duration: 600ms
- Fade and scale combined

**Pulsing (Collected Fragments)**:
- Duration: 1000ms
- Alpha: 0.3 → 0.6
- Scale: 1.0 → 1.2
- Yoyo: true
- Repeat: infinite

**Map Complete (Future)**:
- Combine duration: 800ms
- Simple scale + fade effect

## Environment Visuals

### Walls
- Color: Dark Wood Brown (#4B2E2B)
- Full opacity
- Represents wooden dungeon structures

### Floors
- Color: Sand Beige (#E6C79C)
- Represents sandy/beach areas in pirate theme

### Enemies
- Color: Muted Purple (#7D3C98)
- Size: 14px
- Distinguishable from environment and player

### Treasure Chest
- Main Color: Treasure Gold (#F4B400)
- Accent Color: Crimson Accent (#B33939)
- Size: 32px
- Glow Effect: Treasure Gold at 30% opacity

## Implementation Notes

### Using the Visual Style

```typescript
import { VisualStyle } from '../config/visualStyle';

// For Phaser graphics (numeric colors)
graphics.fillStyle(VisualStyle.ColorNumbers.treasureGold);

// For text styling (hex colors)
text.setColor(VisualStyle.Colors.sandBeige);

// For spacing
const padding = VisualStyle.Spacing.md; // 16px

// For typography
fontSize: `${VisualStyle.Typography.fontSize.body}px`
```

### Color Format Reference

The visual style provides colors in two formats:
- `VisualStyle.Colors.*` - Hex strings (e.g., "#F4B400")
- `VisualStyle.ColorNumbers.*` - Numeric values (e.g., 0xf4b400)

**Always use `ColorNumbers` for Phaser graphics** to avoid runtime conversion overhead.

## Asset Preparation (Future)

When adding Kenney UI assets:

1. **Button Assets**: Look for rounded fantasy-style buttons with wood texture
2. **Panel Assets**: Parchment or wood panel backgrounds
3. **Icon Frames**: Decorative frames matching pirate-fantasy theme
4. **Fonts**: Replace Arial Black with fantasy-style display font
5. **Icons**: Coin icon, fragment/map piece icons, treasure chest sprites

## Accessibility

- Minimum touch target: 48px
- High contrast text on backgrounds
- Clear visual feedback for interactive elements
- Color is not the only differentiator (shape and icons used)
- Readable font sizes (minimum 14px for UI)

## References

- Kenney Assets: https://kenney.nl/assets/tag:interface
- 8px Grid System: Industry standard for UI consistency
- Color Palette: Pirate-fantasy inspired, tested for contrast
