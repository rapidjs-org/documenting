import { AStructure } from "./AStructure";


export class FileStructure extends AStructure {
    public readonly markdown: string;

    constructor(title: string, markdown: string) {
        super(title.replace(/(\.md)?/, ""));

        this.markdown = markdown;
    }
}