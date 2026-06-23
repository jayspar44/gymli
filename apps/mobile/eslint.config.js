// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    // Downgrade rules that produce false positives or are framework-specific noise.
    // This matches the established warnings-only posture of the rest of the monorepo
    // (the old frontend/ had 176 warnings, 0 errors).
    rules: {
      // Function hoisting: `async function foo()` declared after useEffect(() => { foo(); })
      // is valid JS (hoisting) — the rule fires but the code is correct at runtime.
      // Also covers Reanimated shared-value `.value` mutations which are the correct
      // Reanimated API pattern; the rule doesn't know about shared-value semantics.
      'react-hooks/immutability': 'warn',

      // Standard data-loading pattern: useEffect(() => { loadData(); }) where loadData
      // calls setState. This is ubiquitous in React and explicitly shown in React docs.
      'react-hooks/set-state-in-effect': 'warn',

      // Date.now() in event handlers and useRef initialisers — NOT during render.
      // The rule is too broad; these call sites are safe.
      'react-hooks/purity': 'warn',
    },
  },
]);
