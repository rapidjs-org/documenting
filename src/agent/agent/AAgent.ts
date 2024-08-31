import { Dirent, statSync, readdirSync, readFileSync, mkdirSync, rmSync } from "fs";
import { join } from "path";

import { AStructure } from "../structure/AStructure";
import { DirectoryStructure } from "../structure/DirectoryStructure";
import { FileStructure } from "../structure/FileStructure";
import { Renderer } from "../renderer/Renderer";

const _config = {
	indexArticleName: "index",
	tempDirPath: "/tmp/rjs__documenting"
};

mkdirSync(_config.tempDirPath, {
	recursive: true
});
process.on("exit", () =>
	rmSync(_config.tempDirPath, {
		force: true,
		recursive: true
	})
);

// TODO: Checksum (or etag) to prevent unnecessary rebuilds?

export interface IAgentOptions {
	targetDirPath: string;
}

export abstract class AAgent<O extends IAgentOptions> {
	public static tempDirPath: string = _config.tempDirPath;

	private static clearDirectory(path: string) {
		rmSync(path, {
			force: true,
			recursive: true
		});
		mkdirSync(path, {
			recursive: true
		});
	}

	private readonly renderer: Renderer;

	protected readonly options: O;

	constructor(options: O, renderer?: Renderer) {
		this.options = options;

		if (!this.options.targetDirPath) throw new SyntaxError("Missing target path option");

		this.renderer = renderer ?? new Renderer();
	}

	public abstract start(): Promise<void>;

	private readDirTemp(relativePath: string = ".", title: string = null): DirectoryStructure {
		const path: string = join(AAgent.tempDirPath, relativePath);

		if (!statSync(path).isDirectory()) return;

		const structures: AStructure[] = readdirSync(path, {
			withFileTypes: true
		})
			.filter((dirent: Dirent) => {
				return dirent.isDirectory() || (dirent.isFile() && /\.md$/i.test(dirent.name));
			})
			.map((dirent: Dirent) => {
				const title = dirent.name.replace(/^\d\. */i, "");
				return dirent.isDirectory()
					? this.readDirTemp(join(relativePath, dirent.name), title)
					: new FileStructure(title.replace(/\.md$/i, ""), readFileSync(join(path, dirent.name)).toString());
			});
		structures.sort((a: AStructure) => -+(a.title === _config.indexArticleName));

		return new DirectoryStructure(title, structures);
	}

	protected writeTempDir(..._: unknown[]): void | Promise<void> {
		AAgent.clearDirectory(AAgent.tempDirPath);
		AAgent.clearDirectory(this.options.targetDirPath);
	}

	protected render() {
		const parentDirectory: DirectoryStructure = this.readDirTemp();

		this.renderer.render(this.options.targetDirPath, parentDirectory);
	}

	public async trigger(...args: unknown[]) {
		await this.writeTempDir(...args);

		this.render();
	}
}
