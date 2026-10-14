const path = require("path");
const HtmlWebPackPlugin = require("html-webpack-plugin");
const { EnvironmentPlugin } = require("webpack");
const { ModuleFederationPlugin } = require("webpack").container;
const { buildShared } = require("./config/federation.shared");
const pkg = require("./package.json");

// גשר זמני: ספריית הפקדים אינה זמינה כחבילת npm ברשת החיצונית, ולכן נטענת מהתיקייה האחות.
// במעבר לרשת הפנימית: להסיר את הקבוע ואת ה-aliases שמבוססים עליו, ולהוסיף את החבילה ל-package.json.
const UI_LIBRARY_PATH = path.resolve(__dirname, "../ui-library");

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
				// חבילות משותפות ב-Module Federation נפתרות בנפרד מהכלל של ספריית הפקדים, ולכן מופנות במפורש לעותק של אביב
				react: path.resolve(__dirname, "node_modules/react"),
				"react-dom": path.resolve(__dirname, "node_modules/react-dom"),
				"@emotion/react": path.resolve(__dirname, "node_modules/@emotion/react"),
				// התאמה מדויקת לשם החבילה בלבד, לקובץ ה-ESM. נתיבי משנה (כמו @mui/material/useMediaQuery) נפתרים לפי שדה exports,
				// כי הפניה לתיקיית החבילה עוקפת אותו ומחזירה CommonJS, שקבצי ה-ESM של ה-DatePicker לא יכולים לייבא
				"@mui/material$": path.resolve(__dirname, "node_modules/@mui/material/esm/index.js"),
				"@": path.resolve(__dirname, "src"),
				"ui-library": UI_LIBRARY_PATH,
				// ה-dist של הספרייה מייבא חבילות מתוך dist/node_modules, תיקייה שלא נשמרת ב-git של הספרייה.
				// מפנים את הייבואים לחבילות שמותקנות בספרייה עצמה
				[path.join(UI_LIBRARY_PATH, "dist", "node_modules")]: path.join(UI_LIBRARY_PATH, "node_modules")
			}
		},
		devServer: { port: PORT, historyApiFallback: true, open: true, static: false },
		module: {
			rules: [
				{
					// קבצי ספריית הפקדים טוענים חבילות קודם מה-node_modules של אביב, כדי ש-React, MUI ו-Emotion יהיו מופע יחיד.
					// ההגדרה מוגבלת לספרייה: הפעלתה על כל הפרויקט גורמת לחבילות כמו prop-types לקבל גרסה לא תואמת של react-is
					include: UI_LIBRARY_PATH,
					resolve: { modules: [path.resolve(__dirname, "node_modules"), "node_modules"] }
				},
				{
					test: /\.[jt]sx?$/,
					loader: "babel-loader",
					exclude: [/node_modules/, UI_LIBRARY_PATH],
					options: {
						presets: [
							["@babel/preset-env", { modules: false }],
							["@babel/preset-react", { runtime: "automatic" }],
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

