import { AStructure } from "./AStructure";


export class DirectoryStructure extends AStructure {
    public readonly children: AStructure[] = [];

    constructor(title: string, children: AStructure|AStructure[] = [], captionCb?: ((rawCaption: string) => string)) {
        super(title, null, captionCb);
        
        this.append(children);
    }

    public append(children: AStructure|AStructure[]) {
        this.children.push(...[ children ].flat());
    }
}