import { cpSync, existsSync } from "fs";
import { resolve } from "path";

import { AAgent } from "./AAgent";
import { APullAgent } from "./APullAgent";


export class FSPullAgent extends APullAgent<{
	sourceDirPath: string;
	
    secret?: string;
}> {
    protected writeTempDir() {
		super.writeTempDir();

		const sourceDirPath: string = resolve(this.options.sourceDirPath ?? ".");

		if(!existsSync(sourceDirPath)) return;

		cpSync(sourceDirPath, AAgent.tempDirPath, {
			recursive: true
		});
    }
}