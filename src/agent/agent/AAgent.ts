
import { Dirent, statSync, existsSync, readdirSync, readFileSync, mkdirSync, rmSync } from "fs";
import { join } from "path";

import { AStructure } from "../structure/AStructure";
import { DirectoryStructure } from "../structure/DirectoryStructure";
import { FileStructure } from "../structure/FileStructure";
import { Renderer } from "../Renderer";


const _config = {
    indexArticleName: "index",
    tempDirPath: "/tmp/rjs__documenting"
};


const TEMPORARY_DIR_PATH = (() => {
    let i = 0;
    let tempDirPath: string = _config.tempDirPath;
    while(existsSync(tempDirPath)) {
        tempDirPath += "_";
        if(i++ > 100) process.exit(2);
    }
    return tempDirPath;
})();
mkdirSync(TEMPORARY_DIR_PATH, {
    recursive: true
});
process.on("exit", () => rmSync(TEMPORARY_DIR_PATH, {
    force: true,
    recursive: true
}));


// TODO: Checksum to prevent unnecessary rebuilds?


export abstract class AAgent {
    public static tempDirPath: string = TEMPORARY_DIR_PATH;

    private static clearDirectory(path: string) {
        rmSync(path, {
            force: true,
            recursive: true
        });
        mkdirSync(path, {
            recursive: true
        });
    }
    
    private readonly renderer: Renderer;
    
    protected readonly options: {
        [ key: string ]: unknown;
    } & {
        targetDirPath?: string;
    };
    
    constructor(options: { [ key: string ]: unknown; }, renderer?: Renderer) {
        this.options = options;

        this.renderer = renderer ?? new Renderer();
    }

    protected writeTempDir(..._: unknown[]): void|Promise<void> {
        AAgent.clearDirectory(AAgent.tempDirPath);
        AAgent.clearDirectory(this.options.targetDirPath);
    }

    public abstract start(): void|Promise<void>;

    private readDirTemp(relativePath: string = ".", title: string = null): DirectoryStructure {
        const path: string = join(AAgent.tempDirPath, relativePath);

        if(!statSync(path).isDirectory()) return;
        
        const structures: AStructure[] = readdirSync(path, {
            withFileTypes: true
        })
        .filter((dirent: Dirent) => {
            return dirent.isDirectory()
                || (dirent.isFile() && /\.md$/i.test(dirent.name));
        })
        .map((dirent: Dirent) => {
            const title = dirent.name.replace(/^\d\. */i, "");
            return dirent.isDirectory()
            ? this.readDirTemp(join(relativePath, dirent.name), title)
            : new FileStructure(
                title.replace(/\.md$/i, ""),
                readFileSync(join(path, dirent.name)).toString()
            );
        });
        structures.sort((a: AStructure) => -+(a.title === _config.indexArticleName));

        return new DirectoryStructure(title, structures);
    }
    
    protected render() {
        const parentDirectory: DirectoryStructure = this.readDirTemp();
        
        this.renderer.render(this.options.targetDirPath, parentDirectory);
    }
}