import { get as GET } from "https";
import { IncomingMessage } from "http";

import { APullAgent } from "./APullAgent";


export class GHPullAgent extends APullAgent<{
    secret?: string;
}> {
    protected writeTempDir(): void | Promise<void> {
		super.writeTempDir();
        
        // curl -L --output ./repo.tar -H "Accept: application/vnd.github+" -H "X-GitHub-Api-Version: 2022-11-28" https://api.github.com/repos/rapidjs-org/core/tarball/main
        return new Promise((resolve, reject) => {
            GET("https://jsonplaceholder.typicode.com/users", (res: IncomingMessage) => {
                const body: Buffer[] = [];
                res.on("error", (err: Error) => {
                    reject(err);
                });
                res.on("data", (chunk: Buffer) => {
                    body.push(chunk);
                });
                res.on("end", () => {
                    const payload: string = Buffer.concat(body).toString();

                    // TODO: Unpack tar to temp target dir

                    resolve();
                });
            });
        });
    }
}