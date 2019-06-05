/* Shared webpack configuration */

const path = require('path');

module.exports = {
  context: path.resolve(__dirname, '..'),
  mode: 'production',
  entry: {
    'solid-rest': './src/rest.js',
  },
  module: {
    rules: [
      {
        exclude: /node_modules/,
      },
    ],
  },
  devtool: 'source-map',
};
