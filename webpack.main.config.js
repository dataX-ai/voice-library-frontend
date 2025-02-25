module.exports = {
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   */
  entry: './src/main/main.js',
  target: 'electron-main',
  // Put your normal webpack config below here
  module: {
    rules: [
      ...require('./webpack.rules'),
      {
        test: /\.(bat|sh)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]'
            }
          }
        ]
      },
      {
        test: /\.node$/,
        loader: 'node-loader'
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx', '.bat', '.sh', '.node']
  },
  externals: {
    'electron': 'commonjs2 electron'
  },
  node: {
    __dirname: false,
    __filename: false
  }
};
