import markdownit from "markdown-it";

import { IMarkdownTree } from "./interfaces";


export class Renderer {
    private readonly md: markdownit;
    private readonly markdownTree: IMarkdownTree;

    constructor(markdownTree: IMarkdownTree) {
        this.markdownTree = markdownTree;
        this.md = markdownit("commonmark");
    }
    
    render() {
        console.log(this.md.render("# Test"));
    }
};