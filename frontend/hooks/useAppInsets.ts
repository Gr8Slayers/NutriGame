import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Universal safe-area insets hook.
 * Returns the correct top/bottom padding for every device (iOS notch,
 * Android status-bar, edge-to-edge, etc.) without any Platform.OS checks.
 */
export function useAppInsets() {
  const insets = useSafeAreaInsets();
  return insets;
}
