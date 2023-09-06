const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    index: './src/index.js',
    dialog: './src/dialog.js',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'src/index.html',
      chunks: ['index'],
    }),
    new HtmlWebpackPlugin({
      template: 'src/dialog.html',
      filename: 'dialog.html',
      inject: 'body',
      chunks: ['dialog'],
    }),
  ],
};
