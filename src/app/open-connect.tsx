/**
 * Legacy URL: deep links and bookmarks → Connect tab, "Open to connect" segment.
 */
import { Redirect } from 'expo-router';

export default function OpenConnectRedirect() {
  return <Redirect href="/(tabs)/connect?openConnect=1" />;
}
