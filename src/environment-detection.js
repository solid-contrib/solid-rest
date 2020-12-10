// Inspired by https://stackoverflow.com/questions/17575790/environment-detection-node-js-or-browser
const isNode = (function testNode() {
  return typeof process === 'object' && this === global;
})();

const isBrowser = (function testBrowser() {
    return typeof window !== 'undefined' && this === window;
  })();

module.exports = Object.freeze({
  isNode,
  isBrowser,
});
