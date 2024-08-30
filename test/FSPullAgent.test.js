const { join } = require("path");
const { existsSync, readFileSync, rmSync } = require("fs");

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
    await new FSPullAgent({
		interval: 150,
        sourceDirPath: SOURCE_PATH,
        targetDirPath: TARGET_PATH
    })
    .start();
	
	resolve(existsSync(TARGET_PATH));
	
	new UnitTest("Partially check pivot file contents (a/index.html)")
	.actual(() => {
		return readFileSync(join(TARGET_PATH, "./a/index.html"))
		.toString()
		.split(/\n/)[0];
	})
	.expected("<h1>index (0.0)</h1>");

	setTimeout(() => {
		new UnitTest("Check table of contents file contents (toc.json)")
		.actual(JSON.parse(readFileSync(join(TARGET_PATH, "./toc.json")).toString()))
		.expected([
			{
				title: "a",
				caption: "A",
				sections: [
				{
					title: "index",
					caption: "Index (0.0)"
				},
				{
					title: "b",
					caption: "A.B (0.1)"
				},
				{
					title: "a",
					caption: "A.A (0.2)"
				},
				{
					title: "z",
					caption: "A.Z (0.3)"
				}
				]
			},
			{
				title: "b",
				caption: "B",
				sections: [
				{
					title: "a",
					caption: "A",
					sections: [
					{
						title: "a",
						caption: "B.A.A (1.0.0)"
					}
					]
				},
				{
					title: "b-_a  a",
					caption: "B.B A A (1.1)"
				}
				]
			},
			{
				title: "b",
				caption: "B (2)"
			}
		]);
				
		new UnitTest("Check if target directory does not exist (after render deletion)")
		.actual(() => {
			rmSync(TARGET_PATH, { recursive: true });
			
			return existsSync(TARGET_PATH);
		})
		.expected(false);

		setTimeout(() => {
			new UnitTest("Check if target directory does exist (after interval (re)render)")
			.actual(existsSync(TARGET_PATH))
			.expected(true);
		}, 150);
	}, 75);
}))
.expected(true);