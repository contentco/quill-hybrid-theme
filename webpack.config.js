const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

// const autoprefixer = requre('autoprefixer');

const config = {
    entry: './src/quill-hybrid-theme.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'quill-hybrid-theme.js'
    },
    devServer: {
      contentBase: path.join(__dirname),
      compress: true,
      port: 9000
    },
    module: {
        rules: [
        {
            test: /\.scss$/,
            use: ExtractTextPlugin.extract({
                use: [{
                    loader: 'css-loader',
                    options: {
                        minimize: true || {/* CSSNano Options */}
                    }
                }, {
                    loader: 'sass-loader',
                }]
            }),
        },
        {
            test: /\.js$/,
            include: [
                path.resolve(__dirname, "src/"),
                /\/node_modules\/quill/,
            ],
            //exclude: /(node_modules)/,
            use: {
                loader: 'babel-loader',
                options: {
                    presets: [['es2015', {modules: false}],]
                }
            }
        },
        {
            test: /\.png$/,
            loader: "file-loader"
        },
        {
                test: /\.(png|woff|woff2|eot|ttf|svg)$/,
                loader: 'url-loader?limit=100000'
        },

        ]
    },
    plugins: [
        new ExtractTextPlugin('quill-hybrid-theme.css'),
        new UglifyJSPlugin({
            compress: {
                warnings: false,
                screw_ie8: true,
                conditionals: true,
                unused: true,
                comparisons: true,
                sequences: true,
                dead_code: true,
                evaluate: true,
                join_vars: true,
                if_return: true
            },
            output: {
                comments: false
            }
        }),
    ]
};

module.exports = config;
