import { Renderer } from "../Renderer";
import { AAgent } from "./AAgent";


export abstract class APullAgent<O extends { [ key: string ]: unknown; }> extends AAgent {
    protected readonly options: O & {
        interval: number;
    };

    constructor(options: O, renderer: Renderer) {
        super({
            interval: 1000 * 60 * 60 * 12,  // 12h
            
            ...options
        }, renderer);
    }
    
    private async pull() {
        this.writeTempDir();
        
        this.render();
    }

    public start() {
        setInterval(() => this.pull(), this.options.interval);

        this.pull();
    }
}