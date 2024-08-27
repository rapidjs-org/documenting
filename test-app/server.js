process.chdir(__dirname);

const http = require("http");
const fs = require("fs");
const path = require("path");


const API = require("..");
new API.FSPullAgent({
    sourceDirPath: "./md",
    targetDirPath: "./public/docs"
})
.start();


const PORT = 6999;
http
.createServer((req, res) => {
    if(req.url === "/@client") {
        res.end(fs.readFileSync(path.join(__dirname, "../src/client/api.js")));

        return;
    }

    const filepath = path.join(__dirname, "./public", req.url.replace(/\/$/, "/index.html"));
    
    if(fs.existsSync(filepath) && fs.statSync(filepath).isFile()) {
        res.end(fs.readFileSync(filepath));
        
        return;
    }
    
    res.statusCode = 404;
    res.end();
})
.listen(PORT, () => {
    console.log(`\x1b[34m\x1b[2mTest documentation app running at \x1b[22m\x1b[4mhttp://localhost:${PORT}\x1b[24m.\x1b[0m`)
});