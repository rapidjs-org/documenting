import { mkdirSync, writeFile, writeFileSync } from "fs";
import { resolve, join } from "path";

import markdownit from "markdown-it";

import { AStructure } from "./structure/AStructure";
import { DirectoryStructure } from "./structure/DirectoryStructure";
import { FileStructure } from "./structure/FileStructure";


const _config = {
    tocFileName: "toc"
};


interface ITOCEntry {
    title: string;

    sections?: ITOCEntry[];
}


export class Renderer {
    private readonly md: markdownit;
    private readonly targetDirPath: string;

    constructor(targetDirPath: string) {
        this.md = markdownit("commonmark");
        this.targetDirPath = resolve(targetDirPath);
    }

    private renderLevel(directory: DirectoryStructure, nesting: string[] = []): ITOCEntry[] {
        mkdirSync(join(this.targetDirPath, ...nesting), {
            recursive: true
        });

        return directory.children
        .map((structure: AStructure) => {
            if(structure instanceof DirectoryStructure) {
                return {
                    title: structure.title,
                    sections: this.renderLevel(structure, nesting.concat(structure.title ? [ structure.title ] : []))
                };
            }
            
            writeFileSync(
                join(this.targetDirPath, ...nesting, `${structure.title}.html`),
                this.md.render((structure as FileStructure).markdown)
            );

            return {
                title: structure.title
            }
        });
    }

    public render(parentDirectory: DirectoryStructure) {
        writeFileSync(
            join(this.targetDirPath, `${_config.tocFileName}.json`),
            JSON.stringify(this.renderLevel(parentDirectory), null, 2)
        );
    }
};