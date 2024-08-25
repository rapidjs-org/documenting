import { IMarkdownTree } from "../interfaces";
import { Renderer } from "../Renderer";


export abstract class AAgent {
    private readonly renderer: Renderer;
    private readonly targetDirPath: string;

    constructor(targetDirPath: string) {
        this.renderer = new Renderer();
        this.targetDirPath = targetDirPath;
        
        // TODO: Check if target path is dir?
    }

    protected render(markdownTree: IMarkdownTree) {
        this.renderer.render(markdownTree, this.targetDirPath);
    }

    public abstract start(): void;
}