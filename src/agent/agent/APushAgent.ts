import { normalize } from "path";
import { IncomingMessage, ServerResponse, createServer } from "http";

import { Renderer } from "../Renderer";
import { IAgentOptions, AAgent } from "./AAgent";

export interface IPushAgentOptions extends IAgentOptions {
	port: number;
}

export abstract class APushAgent<O extends IPushAgentOptions> extends AAgent<IPushAgentOptions> {
	protected readonly options: O;

	constructor(options: O, renderer?: Renderer) {
		super(
			{
				port: 6001,

				...options
			},
			renderer
		);
	}

	protected respond(res: ServerResponse, status: number) {
		res.statusCode = status;

		res.end();
	}

	public start(): Promise<void> {
		return new Promise((resolve) => {
			createServer((req: IncomingMessage, res: ServerResponse) => {
				try {
					if (req.method.toUpperCase() !== "POST") {
						this.respond(res, 405);

						return;
					}

					if (!["/", "/documentation", "/docs"].includes(normalize(req.url))) {
						this.respond(res, 404);

						return;
					}

					const body: Buffer[] = [];
					req.on("data", (chunk: Buffer) => {
						body.push(chunk);
					});
					req.on("end", () => {
						try {
							const payload: string = Buffer.concat(body).toString();

							this.trigger(payload, req.headers);

							this.respond(res, 200);
						} catch {
							this.respond(res, 400);

							return;
						}
					});
					req.on("error", (err: Error) => {
						console.error(err);

						this.respond(res, 500);
					});
				} catch (err) {
					console.error(err);

					this.respond(res, 500);
				}
			}).listen(this.options.port, resolve);
		});
	}
}
