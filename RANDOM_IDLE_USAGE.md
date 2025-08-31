# Random Idle Animation Usage

This document explains how to use the new random idle animation functionality in the AnimationStateMachine.

## Overview

The system now automatically selects random idle animations when the character returns to idle state, providing more variety and natural movement. **NEW: Idle animations now automatically cycle continuously, starting a new random idle animation every 8 seconds by default.**

## How It Works

1. **Automatic Random Selection**: When an animation finishes and the character returns to idle, a random idle animation is automatically selected from the available idle animations.

2. **Continuous Idle Cycling**: Idle animations now automatically cycle to new random animations every 8 seconds, creating a continuous flow of varied idle poses.

3. **Available Idle Animations**: The system includes 20+ idle animations with variations for both masculine and feminine characters, including:
   - Standing idle with subtle breathing
   - Gentle weight shifting
   - Natural breathing movements
   - Relaxed postures
   - Confident stances

## Available Functions

### Global Functions (accessible via window object)

```javascript
// Manually change to a new random idle animation
window.changeToNewRandomIdle();

// Start automatic idle variation (changes every 10 seconds by default)
window.startIdleVariation(15000); // 15 seconds interval

// Stop automatic idle variation
window.stopIdleVariation();

// Start continuous idle cycling (changes every 8 seconds by default)
window.startIdleCycling(6000); // 6 seconds per idle animation

// Stop continuous idle cycling
window.stopIdleCycling();

// Return to idle (will select random idle)
window.returnToIdle();
```

### Direct Function Calls

```typescript
import { getRandomIdleAnimation, getIdleAnimations } from "./components/animation-loader";

// Get a random idle animation
const randomIdle = getRandomIdleAnimation();
console.log(randomIdle.description);

// Get all idle animations
const allIdles = getIdleAnimations();
console.log(`Found ${allIdles.length} idle animations`);
```

## Usage Examples

### Basic Usage

```javascript
// The system automatically uses random idle animations
// AND continuously cycles through new idle animations every 8 seconds
// No additional setup required
```

### Advanced Usage

```javascript
// Start automatic variation for more dynamic idle behavior
window.startIdleVariation(8000); // Change every 8 seconds

// Manually trigger a new idle animation
window.changeToNewRandomIdle();

// Stop automatic variation
window.stopIdleVariation();

// Customize idle cycling speed
window.startIdleCycling(5000); // Change every 5 seconds

// Stop continuous cycling
window.stopIdleCycling();
```

### Integration with Chat System

```javascript
// When a chat response suggests an idle state
if (response.includes("idle") || response.includes("standing")) {
  window.changeToNewRandomIdle();
}

// Pause cycling during conversations
if (isInConversation) {
  window.stopIdleCycling();
} else {
  window.startIdleCycling();
}
```

## Benefits

1. **Natural Movement**: Characters don't get stuck in the same idle pose
2. **Continuous Variety**: Idle animations automatically cycle every 8 seconds
3. **Rich Variety**: 20+ different idle animations provide endless variety
4. **Zero Setup**: Works automatically out of the box
5. **Customizable**: Can adjust cycling timing or manually trigger changes
6. **Performance**: Lightweight random selection with proper fallback handling

## Technical Details

- **Random Selection**: Uses `Math.random()` for unbiased selection
- **Continuous Cycling**: Automatically starts new idle animations every 8 seconds
- **Fallback Handling**: If no idle animations found, falls back to default
- **State Management**: Integrates with existing AnimationStateMachine
- **Memory Efficient**: No additional memory overhead for random selection
- **TypeScript Support**: Fully typed with proper interfaces
- **Automatic Start**: Idle cycling starts automatically when component mounts

## Troubleshooting

### No Idle Animations Playing

- Check that idle animation files exist in `/animation-library/masculine/glb/idle/`
- Verify animation loader is properly imported
- Check browser console for any loading errors

### Animations Not Changing

- Idle cycling should start automatically every 8 seconds
- Ensure no other animations are currently playing
- Verify the AnimationStateMachine is properly initialized
- Check if `stopIdleCycling()` was called

### Performance Issues

- Idle cycling interval should not be too frequent (recommend 5+ seconds)
- Use `stopIdleCycling()` when not needed
- Monitor memory usage if manually calling `changeToNewRandomIdle()` frequently

### Customizing Cycling Speed

```javascript
// Faster cycling (every 4 seconds)
window.startIdleCycling(4000);

// Slower cycling (every 15 seconds)
window.startIdleCycling(15000);

// Stop cycling completely
window.stopIdleCycling();
```
