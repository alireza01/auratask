import { useAppStore } from './store';

/**
 * Defines the different types of haptic feedback available.
 * Each type corresponds to a specific user action or notification.
 */
export enum HapticFeedbackType {
  Success = 'success',
  Error = 'error',
  Warning = 'warning',
  LevelUp = 'level-up',
  Achievement = 'achievement',
}

/**
 * A mapping of feedback types to their vibration patterns.
 * A single number is a simple vibration duration in milliseconds.
 * An array creates a pattern of [vibrate, pause, vibrate, ...].
 */
const HAPTIC_PATTERNS: Record<HapticFeedbackType, number | number[]> = {
  [HapticFeedbackType.Success]: [100], // Short, sharp buzz
  [HapticFeedbackType.Error]: [70, 50, 70], // Quick double buzz
  [HapticFeedbackType.Warning]: [150], // Slightly longer buzz
  [HapticFeedbackType.LevelUp]: [100, 50, 150], // A celebratory pattern
  [HapticFeedbackType.Achievement]: [150, 50, 100], // A slightly different celebratory pattern
};

/**
 * Triggers haptic feedback on the user's device if supported and enabled.
 * @param type The type of haptic feedback to trigger.
 */
export const triggerHapticFeedback = (type: HapticFeedbackType) => {
  // 1. Check if the user has haptics enabled in settings
  const { hapticFeedbackEnabled } = useAppStore.getState();
  if (!hapticFeedbackEnabled) {
    return;
  }

  // 2. Check if the browser and device support the Vibration API
  if (typeof window !== 'undefined' && window.navigator && 'vibrate' in window.navigator) {
    try {
      // 3. Trigger the corresponding vibration pattern
      const pattern = HAPTIC_PATTERNS[type];
      window.navigator.vibrate(pattern);
    } catch (error) {
      console.error('Haptic feedback failed:', error);
    }
  }
};
