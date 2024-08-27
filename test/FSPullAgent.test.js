const { join } = require("path");
const { rmSync, existsSync, readFileSync } = require("fs");

const { FSPullAgent } = require("../build/api");


const SOURCE_PATH = join(__dirname, "./test-source");
const TARGET_PATH = join(__dirname, "./test-target");
const cleanTargetPath = () => rmSync(TARGET_PATH, {
    force: true,
    recursive: true
});
process.on("exit", cleanTargetPath);
cleanTargetPath();


new UnitTest("Check if target directory does not exist (before)")
.actual(existsSync(TARGET_PATH))
.expected(false);

new UnitTest("Check if target directory does exist (after)")
.actual(new Promise(async (resolve) => {
    await new FSPullAgent(TARGET_PATH, {
        sourceDirPath: SOURCE_PATH
    })
    .start();

    setTimeout(() => {
        resolve(existsSync(TARGET_PATH));

        new UnitTest("Partially check pivot file contents (a/index.html)")
        .actual(() => {
            return readFileSync(join(TARGET_PATH, "./a/index.html"))
            .toString()
            .split(/\n/)[0];
        })
        .expected("<h1>A</h1>");

        new UnitTest("Check table of contents file contents (toc.json)")
        .actual(JSON.parse(readFileSync(join(TARGET_PATH, "./toc.json")).toString()))
        .expected([
            {
              title: "a",
              sections: [
                {
                    title: "index"
                },
                {
                    title: "b"
                },
                {
                    title: "a"
                },
                {
                    title: "z"
                }
              ]
            },
            {
              title: "b",
              sections: [
                {
                  title: "a",
                  sections: [
                    {
                        title: "a"
                    },
                    {
                        title: "b"
                    }
                  ]
                },
                {
                    title: "b"
                }
              ]
            },
            {
                title: "b"
            },
            {
                title: "c"
            }
        ]);
    }, 750);
}))
.expected(true);