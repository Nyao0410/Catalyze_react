const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// watchFoldersにcatalyze_ai_tsを追加
config.watchFolders = [path.resolve(__dirname, '../catalyze_ai_ts')];

// resolverにextraNodeModulesを追加
config.resolver.extraNodeModules = {
  'catalyze-ai': path.resolve(__dirname, '../catalyze_ai_ts'),
};

// TypeScript (.ts/.tsx) を解決できるように sourceExts を明示
const { resolver: defaultResolver } = config;
const sourceExts = defaultResolver.sourceExts || ['js', 'json', 'ts', 'tsx', 'jsx'];

config.resolver = {
  ...defaultResolver,
  sourceExts: Array.from(new Set([...sourceExts, 'ts', 'tsx', 'jsx', 'js', 'json'])),
};

module.exports = config;