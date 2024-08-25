export interface IMarkdownTree {
    filename: string;
    markdown: string;
    
    children?: IMarkdownTree[];
}