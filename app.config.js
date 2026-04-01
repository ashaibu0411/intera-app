/**
 * Dynamic Expo config.
 *
 * iOS crash (TestFlight): SIGABRT on queue `expo.controller.errorRecoveryQueue` — Expo Updates
 * error-recovery threw an uncaught NSException. Disabling EAS Update for **iOS store builds**
 * avoids that native path; Android keeps OTA from app.json.
 *
 * Re-enable iOS OTA after Expo fixes or validation: FORCE_IOS_OTA=1 eas build --platform ios
 */
const appJson = require('./app.json');

module.exports = () => {
  const isIosEasBuild = process.env.EAS_BUILD_PLATFORM === 'ios';
  const forceDisable = process.env.DISABLE_IOS_OTA === '1';
  const forceEnable = process.env.FORCE_IOS_OTA === '1';

  let updatesEnabled = appJson.expo.updates?.enabled !== false;
  if ((isIosEasBuild || forceDisable) && !forceEnable) {
    updatesEnabled = false;
  }

  return {
    ...appJson,
    expo: {
      ...appJson.expo,
      updates: {
        ...(appJson.expo.updates || {}),
        enabled: updatesEnabled,
      },
    },
  };
};
