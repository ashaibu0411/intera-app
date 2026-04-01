const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const { withVibecodeMetro } = require("@vibecodeapp/sdk/metro");

const STRIPE_RN_WEB_STUB = path.resolve(__dirname, "stubs/stripe-react-native.web.js");

function isStripeReactNativeRequest(moduleName) {
  if (typeof moduleName !== "string") return false;
  const n = moduleName.split(path.sep).join("/");
  // Match package root, subpaths, and absolute paths under node_modules (Windows/macOS/Linux).
  return n.includes("@stripe/stripe-react-native");
}

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Disable Watchman for file watching.
config.resolver.useWatchman = false;

// Configure asset and source extensions.
const { assetExts, sourceExts } = config.resolver;

// SVG transformer is configured by withVibecodeMetro
config.transformer = {
  ...config.transformer,
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
};

// Configure resolver with SVG support and web platform mocking
config.resolver = {
  ...config.resolver,
  assetExts: assetExts.filter((ext) => ext !== "svg"),
  sourceExts: [...sourceExts, "svg"],
  useWatchman: false,
  resolveRequest: (context, moduleName, platform) => {
    // Mock native-only modules on web
    if (platform === "web") {
      if (isStripeReactNativeRequest(moduleName)) {
        return {
          type: "sourceFile",
          filePath: STRIPE_RN_WEB_STUB,
        };
      }

      const nativeOnlyModules = [
        "react-native-pager-view",
        "reanimated-tab-view",
        "@bottom-tabs/react-navigation",
      ];

      if (nativeOnlyModules.some((mod) => moduleName.includes(mod))) {
        return {
          type: "empty",
        };
      }
    }

    // Fallback to default resolution
    return context.resolveRequest(context, moduleName, platform);
  },
};

// Integrate NativeWind with the Metro configuration.
module.exports = withNativeWind(withVibecodeMetro(config), { input: "./global.css" });
