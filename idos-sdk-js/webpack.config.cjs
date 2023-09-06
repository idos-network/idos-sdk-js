const path = require("path");

module.exports = {
  entry: "./src/index.js",
  resolve: { extensions: [".js"] },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "index.js",
    library: {
      name: "idos-sdk",
      type: "umd",
    },
  },
};
