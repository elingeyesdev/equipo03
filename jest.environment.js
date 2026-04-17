/**
 * Custom Jest environment to work around Node.js 25+ localStorage SecurityError.
 * Node 25 requires a --localstorage-file flag to use localStorage in node env.
 * This environment patches it to prevent the crash.
 */

const NodeEnvironment = require('jest-environment-node').TestEnvironment;

class CustomEnvironment extends NodeEnvironment {
  constructor(config, context) {
    super(config, context);
  }

  async setup() {
    await super.setup();
    // Provide a no-op localStorage if it's not available
    if (!this.global.localStorage) {
      this.global.localStorage = {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
        clear: () => {},
        key: () => null,
        length: 0,
      };
    }
  }
}

module.exports = CustomEnvironment;
