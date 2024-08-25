import { IMarkdownTree } from "./interfaces";
export declare class Renderer {
    private readonly md;
    private readonly markdownTree;
    constructor(markdownTree: IMarkdownTree);
    render(): void;
}
