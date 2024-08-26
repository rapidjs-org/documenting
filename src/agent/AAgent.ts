
import { Dirent, statSync, existsSync, readdirSync, readFileSync, mkdirSync, rmSync } from "fs";
import { join } from "path";

import { DirectoryStructure } from "../structure/DirectoryStructure";
import { FileStructure } from "../structure/FileStructure";
import { Renderer } from "../Renderer";


const _config = {
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
/* process.on("exit", () => rmSync(TEMPORARY_DIR_PATH, {
    force: true,
    recursive: true
})); */


export abstract class AAgent {
    public static tempDirPath: string = TEMPORARY_DIR_PATH;

    private readonly renderer: Renderer;
    
    constructor(targetDirPath: string) {
        this.renderer = new Renderer(targetDirPath);
    }
    
    protected abstract writeTempDir(...args: unknown[]): void|Promise<void>;

    public abstract start(): void|Promise<void>;

    protected readDirTemp(relativePath: string = ".", title: string = null): DirectoryStructure {
        const path: string = join(AAgent.tempDirPath, relativePath);

        if(!statSync(path).isDirectory()) return;

        return new DirectoryStructure(title, readdirSync(path, {
            withFileTypes: true
        })
        .filter((dirent: Dirent) => {
            return dirent.isDirectory()
                || (dirent.isFile() && /\.md$/i.test(dirent.name));
        })
        .map((dirent: Dirent) => {
            return dirent.isDirectory()
            ? this.readDirTemp(join(relativePath, dirent.name), dirent.name)
            : new FileStructure(dirent.name.replace(/(\.md)$/i, ""), readFileSync(join(path, dirent.name)).toString());
        }));
    }
    
    protected render() {
        const parentDirectory: DirectoryStructure = this.readDirTemp();

        this.renderer.render(parentDirectory);
    }
}