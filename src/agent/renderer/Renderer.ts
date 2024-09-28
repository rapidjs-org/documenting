import { cpSync, mkdirSync, writeFileSync } from "fs";
import { resolve, join, dirname } from "path";

import markdownit from "markdown-it";

import { AStructure } from "../structure/AStructure";
import { DirectoryStructure } from "../structure/DirectoryStructure";
import { FileStructure } from "../structure/FileStructure";
import extraRules from "./extra-rules";

import _config from "../_config.json";

interface ISection {
	caption: string;
	title: string;

	sections?: ISection[];
}

/* class ExtraRules {
	public static syntaxDefinition(md: markdownit) {}
} */

export class Renderer {
	private readonly enableExtraRules: boolean;
	private readonly md: markdownit;

	constructor(
		configuration?: markdownit.PresetName,
		enableExtraRules?: boolean
	);
	constructor(configuration?: markdownit.Options, enableExtraRules?: boolean);
	constructor(
		configuration:
			| markdownit.PresetName
			| markdownit.Options = "commonmark",
		enableExtraRules: boolean = true
	) {
		this.md = markdownit(configuration as markdownit.PresetName);

		this.enableExtraRules = enableExtraRules;
		if (!enableExtraRules) return;

		/* enableExtraRules
		&& this.md.use(ExtraRules.syntaxDefinition); */
	}

	public render(
		targetDirPath: string,
		rootDirectoryStructure: DirectoryStructure
	) {
		const absoluteTargetDirPath = resolve(
			targetDirPath ?? _config.defaultDocsDirPath
		);

		const renderLevel = (
			directory: DirectoryStructure,
			nesting: string[] = []
		): ISection[] => {
			mkdirSync(join(absoluteTargetDirPath, ...nesting), {
				recursive: true
			});

			return directory.children.map((structure: AStructure) => {
				const sectionObj: ISection = {
					title: structure.title,
					caption: structure.caption
				};

				if (structure instanceof DirectoryStructure) {
					return {
						...sectionObj,

						sections: renderLevel(
							structure,
							nesting.concat(
								structure.title ? [structure.title] : []
							)
						)
					};
				}

				let markdown: string = (structure as FileStructure).markdown;
				for (const extraRule of extraRules) {
					if (!this.enableExtraRules) break;
					markdown = extraRule(markdown);
				}

				let markup: string = this.md.render(markdown);

				directory.relativeAssets.paths.forEach(
					(relativeAssetPath: string) => {
						const targetPath: string = join(
							absoluteTargetDirPath,
							_config.assetsDirName,
							...nesting,
							relativeAssetPath
						);
						mkdirSync(dirname(targetPath), {
							recursive: true
						});
						cpSync(
							join(
								directory.relativeAssets.absoluteRootPath,
								relativeAssetPath
							),
							targetPath
						);

						markup = markup.replace(
							new RegExp(
								`src=("|')((?:\\.{1,2}/)+)${_config.assetsDirName}/(.*)\\1`,
								"g"
							),
							`data-src=$1${_config.assetsDirName}/${nesting.join("/")}/$2$3$1`
						);
					}
				);

				writeFileSync(
					join(
						absoluteTargetDirPath,
						...nesting,
						`${structure.title}.html`
					),
					markup
				);

				return sectionObj;
			});
		};

		writeFileSync(
			join(absoluteTargetDirPath, `${_config.tocFileName}.json`),
			JSON.stringify(renderLevel(rootDirectoryStructure), null, 2)
		);
	}
}
