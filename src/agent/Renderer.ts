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


interface ISection {
    title: string;
    caption: string;
    
    sections?: ISection[];
}


export class Renderer {
    private readonly md: markdownit;
    
    constructor() {
        this.md = markdownit("commonmark");
    }

    public render(targetDirPath: string, rootDirectoryStructure: DirectoryStructure) {
        const absoluteTargetDirPath = resolve(targetDirPath ?? _config.defaultDocsDirPath);

        const renderLevel = (directory: DirectoryStructure, nesting: string[] = []): ISection[] => {
            mkdirSync(join(absoluteTargetDirPath, ...nesting), {
                recursive: true
            });
    
            return directory.children
            .map((structure: AStructure) => {
                const sectionObj: ISection = {
                    title: structure.title,
                    caption: structure.caption
                };

                if(structure instanceof DirectoryStructure) {
                    return {
                        ...sectionObj,

                        sections: renderLevel(structure, nesting.concat(structure.title ? [ structure.title ] : []))
                    };
                }
                
                writeFileSync(
                    join(absoluteTargetDirPath, ...nesting, `${structure.title}.html`),
                    this.md.render((structure as FileStructure).markdown)
                );
    
                return sectionObj;
            });
        };

        writeFileSync(
            join(absoluteTargetDirPath, `${_config.tocFileName}.json`),
            JSON.stringify(renderLevel(rootDirectoryStructure), null, 2)
        );
    }
};