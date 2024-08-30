export abstract class AStructure {
    public static getDisplayCaption(rawCaption: string): string {
        return rawCaption
        .replace(/(\s|_|-)+/g, " ")
        .replace(/((^| )[a-z])/g, (_, initial: string) => initial.toUpperCase());
    }

    public readonly title: string;
    public readonly caption: string;

    constructor(title: string, caption?: string, captionCb?: ((rawCaption: string) => string)) {
        this.title = title;

        this.caption = (captionCb ?? AStructure.getDisplayCaption)(caption || title || "") ?? null;
    }
}