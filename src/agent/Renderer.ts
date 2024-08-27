import { mkdirSync, writeFile, writeFileSync } from "fs";
import { resolve, join } from "path";

import markdownit from "markdown-it";

import { AStructure } from "./structure/AStructure";
import { DirectoryStructure } from "./structure/DirectoryStructure";
import { FileStructure } from "./structure/FileStructure";


const _config = {
    defaultDocsDirPath: "./docs",
    tocFileName: "toc"
};


interface ITOCEntry {
    title: string;
    
    sections?: ITOCEntry[];
}


export class Renderer {
    private readonly md: markdownit;
    
    constructor() {
        this.md = markdownit("commonmark");
    }

    public render(targetDirPath: string, rootDirectoryStructure: DirectoryStructure) {
        const absoluteTargetDirPath = resolve(targetDirPath ?? _config.defaultDocsDirPath);

        const renderLevel = (directory: DirectoryStructure, nesting: string[] = []): ITOCEntry[] => {
            mkdirSync(join(absoluteTargetDirPath, ...nesting), {
                recursive: true
            });
    
            return directory.children
            .map((structure: AStructure) => {
                if(structure instanceof DirectoryStructure) {
                    return {
                        title: structure.title,
                        sections: renderLevel(structure, nesting.concat(structure.title ? [ structure.title ] : []))
                    };
                }
                
                writeFileSync(
                    join(absoluteTargetDirPath, ...nesting, `${structure.title}.html`),
                    this.md.render((structure as FileStructure).markdown)
                );
    
                return {
                    title: structure.title
                }
            });
        };

        writeFileSync(
            join(absoluteTargetDirPath, `${_config.tocFileName}.json`),
            JSON.stringify(renderLevel(rootDirectoryStructure), null, 2)
        );
    }
};