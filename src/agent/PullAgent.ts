import { IMarkdownTree } from "../interfaces";
import { AAgent } from "./AAgent";


export class PullAgent extends AAgent {
    private readonly sourceURI: string;
    private readonly intervalHours: number;

    constructor(options: {
        sourceURI: string;
        intervalHours: number;
    }, targetDirPath: string) {
        super(targetDirPath);

        const optionsWithDefaults = {
            intervalHours: 24,

            ...options
        };

        this.sourceURI = optionsWithDefaults.sourceURI;
        this.intervalHours = optionsWithDefaults.intervalHours;

        // TODO: Check if source exists?
    }

    private handleInterval() {
        // TODO

        const markdownTree: IMarkdownTree = null;

        // TODO
        
        this.render(markdownTree);
    }

    public start() {
        setInterval(() => this.handleInterval(), this.intervalHours);
    }
}