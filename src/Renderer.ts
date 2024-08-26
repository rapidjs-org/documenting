import { mkdirSync, writeFile, writeFileSync } from "fs";
import { resolve, join } from "path";

import markdownit from "markdown-it";

import { AStructure } from "./structure/AStructure";
import { DirectoryStructure } from "./structure/DirectoryStructure";
import { FileStructure } from "./structure/FileStructure";


export class Renderer {
    private readonly md: markdownit;
    private readonly targetDirPath: string;

    constructor(targetDirPath: string) {
        this.md = markdownit("commonmark");
        this.targetDirPath = resolve(targetDirPath);
    }

    render(directory: DirectoryStructure, nesting: string[] = []) {
        mkdirSync(join(this.targetDirPath, ...nesting), {
            recursive: true
        });
        
        directory.children
        .forEach((structure: AStructure) => {
            if(structure instanceof DirectoryStructure) {
                this.render(structure, nesting.concat(structure.title ? [ structure.title ] : []));
                
                return;
            }
            // TODO: Order?
            // TODO: Indexes?
            writeFileSync(
                join(this.targetDirPath, ...nesting, `${structure.title}.html`),
                this.md.render((structure as FileStructure).markdown)
            );
        });
    }
};