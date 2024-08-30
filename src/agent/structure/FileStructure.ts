import { AStructure } from "./AStructure";


export class FileStructure extends AStructure {
    public readonly markdown: string;

    constructor(title: string, markdown: string, captionCb?: ((rawCaption: string) => string)) {
        super(
            title
            .replace(/(\.md)?/, ""),
            (markdown.match(/^\s*#{1,5} +([^\n]+)/) ?? [ null, "" ])[1].trim(),
            captionCb
        );

        this.markdown = markdown;
    }
}