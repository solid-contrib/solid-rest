const path = require('path')

// Configurations shared between all builds 
const common = {
    mode: 'production',
    entry: './src/index.js',
    output: {
        filename: 'solid-rest-browser.bundle.js',
        library: 'SolidRestBrowser',
        libraryExport: 'default',
    },
    devtool: 'source-map',
}

// Configurations specific to the window build
const window = {
    ...common,
    name: 'window',
    output: {
        ...common.output,
        path: path.resolve(__dirname, 'dist'),
        libraryTarget: 'umd',
    },
    module: {
        rules: [
            {
                loader: 'babel-loader',
                exclude: /node_modules/,
            },
        ],
    },
}

// Configurations specific to the node build
/*
const node = {
    ...common,
    name: 'node',
    output: {
        ...common.output,
        path: path.resolve(__dirname, 'dist', 'node'),
        libraryTarget: 'commonjs2',
    },
}
*/
module.exports = [
    window,
//    node
]
