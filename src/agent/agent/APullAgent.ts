import { Renderer } from "../renderer/Renderer";
import { IAgentOptions, AAgent } from "./AAgent";

export interface IPullAgentOptions extends IAgentOptions {
	interval: number;
}

export abstract class APullAgent<
	O extends IPullAgentOptions
> extends AAgent<IPullAgentOptions> {
	protected readonly options: O;

	constructor(options: O, renderer: Renderer) {
		super(
			{
				interval: 1000 * 60 * 60 * 12, // 12h

				...options
			},
			renderer
		);
	}

	public start(): Promise<void> {
		return new Promise((resolve) => {
			this.options.interval &&
				setInterval(() => this.trigger(), this.options.interval);

			this.trigger();

			resolve();
		});
	}
}
