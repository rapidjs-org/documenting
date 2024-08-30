import { cpSync, existsSync } from "fs";
import { resolve } from "path";

import { AAgent } from "./AAgent";
import { IPullAgentOptions, APullAgent } from "./APullAgent";


export interface IFSPullAgentOptions extends IPullAgentOptions {
    sourceDirPath: string;

    secret?: string;
}

export class FSPullAgent extends APullAgent<IFSPullAgentOptions> {
    protected writeTempDir() {
		super.writeTempDir();

		const sourceDirPath: string = resolve(this.options.sourceDirPath ?? ".");

		if(!existsSync(sourceDirPath)) return;
		
		cpSync(sourceDirPath, AAgent.tempDirPath, {
			recursive: true
		});
    }
}