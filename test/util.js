const { rmSync } = require("fs");


module.exports.declareTargetPath = function(targetPath) {
    const cleanTargetPath = () => rmSync(targetPath, {
        force: true,
        recursive: true
    });
    
    cleanTargetPath();

    process.on("exit", cleanTargetPath);
};