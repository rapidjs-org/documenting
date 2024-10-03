const { join } = require("path");
const { existsSync } = require("fs");

const util = require("./util");

const { GHPullAgent } = require("..");


const TARGET_PATH = join(__dirname, "./test-target--ghpull");
util.declareTargetPath(TARGET_PATH);


new UnitTest("Check if target directory does not exist (before render)")
.actual(existsSync(TARGET_PATH))
.expected(false);

new UnitTest("Check if target directory does exist (after render)")
.actual(new Promise(async (resolve) => {
    await new GHPullAgent({
        targetDirPath: TARGET_PATH,
        interval: 0,
        account: "rapidjs-org",
        repository: "documenting",
        rootPath: "test/test-source/"
    })
    .start();

    setTimeout(() => {
        resolve(existsSync(TARGET_PATH));
        
        new UnitTest("Check if pivot file exist (a/a.html)")
		.actual(existsSync(join(TARGET_PATH, "./a/a.html")))
		.expected(true);
    }, 500);    // TODO: Enhance reliability (no hardcoded times; might result in test case failing due to race)
}))
.expected(true);