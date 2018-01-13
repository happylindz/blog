const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
module.exports = {
  entry: {
    pageA: [path.resolve(__dirname, './src/pageA.js')],
    pageB: path.resolve(__dirname, './src/pageB.js'),
  },
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: 'js/[name].[chunkhash:8].js',
    chunkFilename: 'js/[name].[chunkhash:8].js'
  },
  module: {
    rules: [
      {
        // 用正则去匹配要用该 loader 转换的 CSS 文件
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
          fallback: "style-loader",
          use: ["css-loader"]
        })  
      }
    ]
  },
  plugins: [
    new webpack.HashedModuleIdsPlugin(),
    new webpack.optimize.CommonsChunkPlugin({
      name: 'common',
      minChunks: 2,
    }),
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
      minChunks: ({ resource }) => (
        resource && resource.indexOf('node_modules') >= 0 && resource.match(/\.js$/)
      )
    }),
    new webpack.optimize.CommonsChunkPlugin({
      name: 'runtime',
      minChunks: Infinity,
    }),
    new ExtractTextPlugin({
      filename: `css/[name].[contenthash:8].css`,
    }),
  ]
}