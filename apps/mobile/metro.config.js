const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);
config.resolver.sourceExts.push('cjs');                // Firebase ships .cjs files
config.resolver.unstable_enablePackageExports = false; // fixes "Component auth has not been registered yet" on Hermes

module.exports = withNativeWind(config, { input: './global.css' });
