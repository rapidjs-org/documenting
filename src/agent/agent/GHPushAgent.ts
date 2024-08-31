import { IncomingHttpHeaders } from "http";
import { createHmac, timingSafeEqual } from "crypto";

import { Renderer } from "../renderer/Renderer";
import { IPushAgentOptions, APushAgent } from "./APushAgent";
import { IGHPullAgentOptions, GHPullAgent } from "./GHPullAgent";

export interface IGHPushAgentOptions extends IGHPullAgentOptions {
	secret?: string;
}

type TGHPushAgentOptions = IPushAgentOptions & IGHPushAgentOptions;

export class GHPushAgent extends APushAgent<TGHPushAgentOptions> {
	private readonly pullAgent: GHPullAgent;

	constructor(options: TGHPushAgentOptions, renderer: Renderer) {
		super(options, renderer);

		this.pullAgent = new GHPullAgent(
			{
				targetDirPath: options.targetDirPath,
				interval: 0,
				account: options.account,
				repository: options.repository
			},
			renderer
		);
		this.pullAgent.start();
	}

	protected writeTempDir(payload: string, headers: IncomingHttpHeaders): void | Promise<void> {
		super.writeTempDir(payload, headers);

		if (!this.options.secret) {
			this.pullAgent.trigger();

			return;
		}

		const signatureHeader: string = [headers["x-hub-signature-256"]].flat()[0];
		if (!signatureHeader) throw new SyntaxError("Invalid hook request");

		const digest = Buffer.from(
			`sha256=${createHmac("sha256", this.options.secret).update(payload).digest("hex")}`,
			"utf8"
		);
		const signature = Buffer.from(signatureHeader, "utf8");
		if (!timingSafeEqual(digest, signature)) {
			throw new Error("Authentication failed");
		}

		this.pullAgent.trigger();
	}
}
