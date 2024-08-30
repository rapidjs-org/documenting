import { request } from "https";
import { IncomingMessage } from "http";
import { join } from "path";
import { createWriteStream, rmSync } from "fs";

import { extract } from "tar";

import { AAgent } from "./AAgent";
import { IPullAgentOptions, APullAgent } from "./APullAgent";


export interface IGHPullAgentOptions extends IPullAgentOptions {
    account: string;
    repository: string;

    ref?: string;
    auth?: string;
}


export class GHPullAgent extends APullAgent<IGHPullAgentOptions> {
    protected writeTempDir(): void | Promise<void> {
		super.writeTempDir();
        
        return new Promise(async (resolve, reject) => {
            const requestGitHubAPI = (method: string, url: string): Promise<IncomingMessage> => {
                return new Promise((resolve) => {
                    request(url, {
                        method: method,
                        headers: {
                            "Accept": "application/vnd.github+",
                            "X-GitHub-Api-Version": "2022-11-28",
                            "User-Agent": "request",
                            
                            ...this.options.auth
                            ? { "Authorization": `Bearer ${this.options.auth}` }
                            : {}
                        }
                    }, (res: IncomingMessage) => {
                        [ "2", "3" ].includes(res.statusCode.toString().charAt(0))
                        ? resolve(res)
                        : reject(new Error(res.statusMessage));
                    })
                    .on("error", reject)
                    .end();
                });
            };
            
            const endpoint: string = `${
                "https://api.github.com"
            }${
                join("/repos/", this.options.account, this.options.repository, "./tarball", this.options.ref ?? "main")
            }`;
            const locRes: IncomingMessage = await requestGitHubAPI("HEAD", endpoint);
            
            const tarpath: string = join(AAgent.tempDirPath, "../repo.tar.gz");
            const file = createWriteStream(tarpath);
            const tarRes = await requestGitHubAPI("GET", locRes.headers.location);
            tarRes.pipe(file);
            file.on("finish", () => {
                file.close((err: Error) => {
                    if(err) {
                        reject(err);
                        
                        return;
                    }
                    
                    extract({
                        file: tarpath,
                        cwd: AAgent.tempDirPath,
                        strip: 1
                    })
                    .then(resolve)
                    .finally(() => {
                        rmSync(tarpath, {
                            force: true
                        });
                    });
                });
            });
        });
    }
}