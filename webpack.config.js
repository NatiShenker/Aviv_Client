const path = require("path");
const HtmlWebPackPlugin = require("html-webpack-plugin");
const { EnvironmentPlugin } = require("webpack");
const { ModuleFederationPlugin } = require("webpack").container;
const { buildShared } = require("./config/federation.shared");
const pkg = require("./package.json");

module.exports = ({ sviva, mode }) => {
	const PORT = 4171;

	const svivaPrefixMap = {
		dev: "dev-",
		prod: ""
	};

	const SVIVA = svivaPrefixMap[sviva] || "dev-";
	const isLocal = mode === "development";

	// equivalent ל-base של Vite
	const PUBLIC_PATH = isLocal ? "/" : "Aviv_Client";

	const envVriables = {
		local: {
			mode: 'production',
			output: {
				publicPath: `http://localhost:${PORT}/`,
				path: path.resolve(__dirname, 'build'),  // ← הוסף
				filename: "[name].js",                   // ← הוסף (בלי contenthash בlocal)
				clean: true,
			},
			publicUrl: '',
			devtool: 'eval-source-map',
		},
		dev: {
			mode: 'production',
			output: {
				// publicPath: PUBLIC_PATH,
				path: path.resolve(__dirname, 'build'),
				filename: "[name].[contenthash].js",
				clean: true,
			},
			publicUrl: PUBLIC_PATH,
			devtool: 'source-map',
			// sviva: 'dev-'
		},
		prod: {
			mode: 'production',
			output: {
				path: path.resolve(__dirname, 'build'),
				filename: "[name].[contenthash].js",
				clean: true,
			},
			publicUrl: PUBLIC_PATH,
			devtool: 'none',
			// sviva: ''
		}
	}

	return {

		entry: "./index.ts",
		output: envVriables[sviva].output,
		resolve: {
			extensions: [".tsx", ".ts", ".jsx", ".js", ".json"],
			alias: {
				'@mui/material': path.resolve(__dirname, 'node_modules/@mui/material'),
				"@": path.resolve(__dirname, "src")
			}
		},
		devServer: { port: PORT, historyApiFallback: true, open: true, static: { directory: path.resolve(__dirname, "./") } },
		module: {
			rules: [
				{
					test: /\.[jt]sx?$/,
					loader: "babel-loader",
					exclude: /node_modules/,
					options: {
						presets: [
							["@babel/preset-env", { modules: false }],
							"@babel/preset-react",
							"@babel/preset-typescript"
						]
					}
				},
				{
					test: /\.css$/,
					use: [
						{ loader: "style-loader", options: { insert: 'head' } },
						"css-loader",
						'postcss-loader'
					]
				}
			]
		},

		plugins: [
			new ModuleFederationPlugin({
				name: "Aviv_Client_Wrapper",
				filename: "remoteEntry.js",
				exposes: {
					// './Monim': './src/components/MetersExpanded.tsx',
				},
				remotes: {
					// 'shell': 'Digital_shell@https://dev-workspace.rnd.io/Host_Client/remoteentry.js'
				},
				shared: buildShared({ pkg, require })
			}),
			new HtmlWebPackPlugin({
				template: "./index.html",
			}),
			new EnvironmentPlugin({ __SVIVA__: SVIVA })

		],
		devtool: mode !== "prod" ? "source-map" : false
	};
};

