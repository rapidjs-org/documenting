const { join } = require("path");
const { existsSync, rmSync } = require("fs");

const util = require("./util");

const { FSPullAgent } = require("..");


const SOURCE_PATH = join(__dirname, "./test-source");
const TARGET_PATH = join(__dirname, "./test-target--fspull");
util.declareTargetPath(TARGET_PATH);


new UnitTest("Check if target directory does not exist (before render)")
.actual(existsSync(TARGET_PATH))
.expected(false);

new UnitTest("Check if target directory does exist (after render)")
.actual(new Promise(async (resolve) => {
    new FSPullAgent({
		interval: 150,
        sourceDirPath: SOURCE_PATH,
        targetDirPath: TARGET_PATH
    })
    .start();
	
	resolve(existsSync(TARGET_PATH));
	
	setTimeout(() => {	
		new UnitTest("Check if target directory does not exist (after render deletion)")
		.actual(() => {
			rmSync(TARGET_PATH, { recursive: true });

			setTimeout(() => {
				new UnitTest("Check if target directory does exist (after interval (re)render)")
				.actual(existsSync(TARGET_PATH))
				.expected(true);
			}, 150);
			
			return existsSync(TARGET_PATH);
		})
		.expected(false);
	}, 75);
}))
.expected(true);