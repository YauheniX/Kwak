# Examples Directory

This directory contains usage examples and reference implementations for the game's core systems.

## Available Examples

### progressionUsageExample.ts

Comprehensive demonstration of the Progression System integration showing:

1. **Initialization**: How to create and configure the progression system
2. **Difficulty Scaling**: Apply difficulty modifiers to game systems at run start
3. **Reward Calculation**: Calculate and apply rewards after run completion
4. **Meta-Progression Shop**: Example shop system for persistent upgrades
5. **Status Display**: Display player progression metrics
6. **Complete Integration**: Full lifecycle from game start to completion

#### Usage

The example is provided as a reference implementation. To use:

1. Review the example code to understand integration patterns
2. Copy relevant functions into your actual game scenes
3. Adapt the code to match your specific implementation

To run the complete example (for testing):
```typescript
import { completeProgressionExample } from './examples/progressionUsageExample';
completeProgressionExample();
```

#### Key Integration Points

**GameScene (create method):**
- Initialize progression system
- Get difficulty modifiers based on games played
- Apply modifiers to room generation, enemy spawning, and fragment system

**GameOverScene (or end-of-run handler):**
- Calculate run rewards
- Apply rewards to progression
- Update save manager with totals
- Check for level-ups and unlocks

**Menu/Shop Scene:**
- Display progression metrics
- Allow purchases using persistent currency
- Handle unlock logic

## Adding New Examples

When adding new examples:

1. Create a new `.ts` file in this directory
2. Use clear, descriptive function names
3. Include comprehensive comments
4. Export key functions for testing
5. Update this README with a description
6. Ensure the example builds without errors

## Best Practices

- Examples should be **reference implementations**, not production code
- Keep examples **self-contained** when possible
- Use `console.log` for output to demonstrate functionality
- Comment any code that needs adaptation for actual use
- Show both basic and advanced usage patterns
