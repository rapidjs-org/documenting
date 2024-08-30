const { join } = require("path");
const { existsSync, rmSync } = require("fs");
const { request } = require("http");
const { createHmac } = require("crypto");

const util = require("./util");

const { GHPushAgent } = require("..");


const TARGET_PATH = join(__dirname, "./test-target--ghpush");
util.declareTargetPath(TARGET_PATH);


new UnitTest("Check if target directory does not exist (before render)")
.actual(existsSync(TARGET_PATH))
.expected(false);

new UnitTest("Check if target directory does exist (after render)")
.actual(new Promise(async (resolve) => {
    const SECRET = "example";

    await new GHPushAgent({
        targetDirPath: TARGET_PATH,
        account: "rapidjs-org",
        repository: "testing",
        secret: SECRET
    })
    .start();
    
    resolve(existsSync(TARGET_PATH));

    new UnitTest("Check if target directory does not exist (after render deletion)")
    .actual(() => {
        rmSync(TARGET_PATH, { recursive: true });
        
        return existsSync(TARGET_PATH);
    })
    .expected(false);

    new UnitTest("Check if target directory does not exist (after invalid push attempt)")
    .actual(new Promise((resolve, reject) => {
        request("http://localhost/any", {
            method: "POST",
            port: 6001,
            headers: {
                "Content-Type": "application/json",
                "x-hub-signature-256": `abc`
            }
        }, () => {
            resolve(existsSync(TARGET_PATH));

            new UnitTest("Check if target directory does exist (after successful push attempt)")
            .actual(new Promise((resolve, reject) => {
                const payload = JSON.stringify({
                    foo: "bar"
                });
                request("http://localhost/docs", {
                    method: "POST",
                    port: 6001,
                    headers: {
                        "Content-Type": "application/json",
                        "x-hub-signature-256": `sha256=${
                            createHmac("sha256", SECRET)
                            .update(payload)
                            .digest("hex")
                        }`
                    }
                }, () => {
                    resolve(existsSync(TARGET_PATH));
                })
                .on("error", reject)
                .end(payload);
            }))
            .expected(true);
        })
        .on("error", reject)
        .end();
    }))
    .expected(false);
}))
.expected(true);