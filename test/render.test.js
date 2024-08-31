const { join } = require("path");
const { readFileSync } = require("fs");

const util = require("./util");

const { FSPullAgent } = require("..");


const SOURCE_PATH = join(__dirname, "./test-source");
const TARGET_PATH = join(__dirname, "./test-target--render");
util.declareTargetPath(TARGET_PATH);


new FSPullAgent({
	interval: 150,
	sourceDirPath: SOURCE_PATH,
	targetDirPath: TARGET_PATH
})
.start();

setTimeout(() => {
	new UnitTest("Partially validate pivot file contents (a/index.html)")
	.actual(
		readFileSync(join(TARGET_PATH, "./a/index.html"))
		.toString()
		.split(/\n/)[0]
	)
	.expected("<h1>index (0.0)</h1>");

	new UnitTest("Validate custom rule 'syntax definition'")
	.actual(
		readFileSync(join(TARGET_PATH, "./custom-rules.html"))
		.toString()
		.split(/\n/)[2]
	)
	.expected("<div class=\"rJS__documenting--syntax\"><code>function helloWorld(): string</code></div>");

	new UnitTest("Validate custom rule 'parameter definition'")
	.actual(
		readFileSync(join(TARGET_PATH, "./custom-rules.html"))
		.toString()
		.split(/\n/)[4]
	)
	.expected("<table class=\"rJS__documenting--parameter\"><tr><td><code>argument 1</code></td><td><p>Example argument at pos 0.</p></td></tr><tr><td><code>arg2</code></td><td><p>Example argument at pos 1.</p></td></tr><tr><td><code>arg3</code></td><td><p>Example argument at pos 2.</p></td></tr></table>");

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
		},
		{
			title: "custom-rules",
			caption: "Custom Rules"
		}
	]);
}, 75);