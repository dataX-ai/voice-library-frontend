module.exports = {
  module: {
    rules: require('./webpack.rules'),
  },
  resolve: {
    extensions: ['.js']
  },
  // Mark Node.js built-in modules as external
  externals: {
    'electron': 'commonjs2 electron',
    'fs': 'commonjs2 fs',
    'path': 'commonjs2 path',
    'crypto': 'commonjs2 crypto'
  },
  target: 'electron-preload'
}; 