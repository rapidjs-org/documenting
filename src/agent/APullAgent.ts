import { AAgent } from "./AAgent";


export abstract class APullAgent<O extends { [ key: string ]: unknown; }> extends AAgent {
    protected readonly options: O & {
        interval: number;
    };

    constructor(targetDirPath: string, options: O) {
        super(targetDirPath);

        this.options = {
            interval: 1000 * 60 * 60 * 12,  // 12h
            
            ...options
        };
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