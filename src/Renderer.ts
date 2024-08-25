import { writeFile } from "fs";
import { join } from "path";

import markdownit from "markdown-it";

import { IMarkdownTree } from "./interfaces";


export class Renderer {
    private readonly md: markdownit;

    constructor() {
        this.md = markdownit("commonmark");
    }
    
    render(markdownTree: IMarkdownTree, targetDirPath: string) {
        const targetPath: string = join(targetDirPath, markdownTree.filename);
        const markup: string = this.md.render(markdownTree.markdown);

        writeFile(targetPath.replace(/(\.md)?$/, ".html"), markup, (err: Error) => {
            if(!err) return;

            console.error(err);
        });

        (markdownTree.children ?? [])
        .forEach((childMarkdownTree: IMarkdownTree) => {
            this.render(childMarkdownTree, targetPath);
        });
    }
};