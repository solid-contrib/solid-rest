/* Browser bundle that exposes solid-rest as window.appfetch */

const path = require('path');
// const CleanWebpackPlugin = require('clean-webpack-plugin');
const { context, mode, entry, module: _module, devtool } = require('./webpack.common.config');

const outputDir = './dist/browser';

//    "babel-cli": "^6.26.0",

module.exports = {
  context,
  mode,
//  entry: ['babel-polyfill', './src/rest.js'],
  entry: ['./src/rest.js'],
  externals : {
    "fs" : "fs"
  },
  output: {
    filename: 'solid-rest.js',
    path: path.resolve(outputDir),
    // libraryExport: 'SolidRest',
    library: 'SolidRest',
    libraryTarget: 'umd',
  },
  module: _module,
//  plugins: [new CleanWebpackPlugin([outputDir])],
  devtool
};
