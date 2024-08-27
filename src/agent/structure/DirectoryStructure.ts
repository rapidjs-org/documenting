import { AStructure } from "./AStructure";


export class DirectoryStructure extends AStructure {
    private readonly childStructures: AStructure[];

    constructor(title: string, children: AStructure[] = []) {
        super(title);

        this.childStructures = children;
    }

    public appendChild(childStructure: AStructure) {
        this.childStructures.push(childStructure);
    }

    public get children(): AStructure[] {
        return this.childStructures;
    }
}