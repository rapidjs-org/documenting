import { AStructure } from "./AStructure";

export interface IDirectoryAssets {
	absoluteRootPath: string;
	paths: string[];
}

export class DirectoryStructure extends AStructure {
	public readonly children: AStructure[] = [];
	public readonly relativeAssets: IDirectoryAssets;

	constructor(
		title: string,
		children: AStructure | AStructure[] = [],
		relativeAssets: IDirectoryAssets,
		captionCb?: (rawCaption: string) => string
	) {
		super(title, null, captionCb);

		this.relativeAssets = relativeAssets;

		this.append(children);
	}

	public append(children: AStructure | AStructure[]) {
		this.children.push(...[children].flat());
	}
}
