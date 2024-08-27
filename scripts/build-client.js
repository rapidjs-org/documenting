const fs = require("fs");
const path = require("path");

const UglifyJS = require("uglify-js");


const SOURCE_PATH = path.join(__dirname, "../src/client/api.js");
const TARGET_PATH = path.join(__dirname, "../build/client/rjs.documenting.js");


const minifiedJs = UglifyJS
.minify({
    "api.js": fs.readFileSync(SOURCE_PATH).toString()
});
if(minifiedJs.error) throw minifiedJs;

fs.mkdirSync(path.dirname(TARGET_PATH), {
    recursive: true
});
fs.writeFileSync(TARGET_PATH, minifiedJs.code);