const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

function addLivekitWebrtcPod(podfileContents) {
  const podLine = "  pod 'livekit-react-native-webrtc', :path => '../node_modules/@livekit/react-native-webrtc'\n";
  if (podfileContents.includes("pod 'livekit-react-native-webrtc'")) return podfileContents;

  // Insert inside the main app target block.
  // This is intentionally simple and idempotent.
  const targetRe = /(target\s+['"][^'"]+['"]\s+do\s*\n)/;
  const m = podfileContents.match(targetRe);
  if (!m) return podfileContents;

  const idx = m.index + m[1].length;
  return podfileContents.slice(0, idx) + podLine + podfileContents.slice(idx);
}

module.exports = function withLivekitWebrtcPod(config) {
  return withDangerousMod(config, [
    'ios',
    async (cfg) => {
      const podfilePath = path.join(cfg.modRequest.platformProjectRoot, 'Podfile');
      try {
        const current = fs.readFileSync(podfilePath, 'utf8');
        const next = addLivekitWebrtcPod(current);
        if (next !== current) fs.writeFileSync(podfilePath, next, 'utf8');
      } catch (e) {
        // If Podfile doesn't exist yet, do nothing (prebuild will create it).
        // EAS prebuild will rerun this mod after generation.
      }
      return cfg;
    },
  ]);
};

