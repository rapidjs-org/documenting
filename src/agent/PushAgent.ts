import { normalize } from "path";
import { Server, IncomingMessage, ServerResponse, createServer } from "http";
import { BinaryLike, createHmac, timingSafeEqual } from "crypto";

import { IMarkdownTree } from "../interfaces";
import { AAgent } from "./AAgent";


export class PushAgent extends AAgent {
    private readonly secret: string;
    private readonly port: number;
    private readonly server: Server;

    constructor(options: {
        port: number;
        secret: string;
    }, targetDirPath: string) {
        super(targetDirPath);

        const optionsWithDeafults = {
            port: 6001,

            ...options
        };

        this.secret = optionsWithDeafults.secret;
        this.port = optionsWithDeafults.port;
        this.server = createServer((req: IncomingMessage, res: ServerResponse) => {
            try {
                this.handleRequest(req, res);
            } catch(err) {
                console.error(err);
                
                this.respond(res, 500);
            }
        });
    }

    private respond(res: ServerResponse, status: number) {
        res.statusCode = status;

        res.end();
    }

    private handleRequest(req: IncomingMessage, res: ServerResponse) {
        if(req.method.toUpperCase() !== "POST") {
            this.respond(res, 405);

            return;
        }
        
        if(![
            "/documentation",
            "/docs"
        ].includes(normalize(req.url))) {
            this.respond(res, 404);
            
            return;
        }
        
        const body: Buffer[] = [];
        req.on("error", (err: Error) => {
            console.error(err);
            
            this.respond(res, 500);
        });
        req.on("data", (chunk: Buffer) => {
            body.push(chunk);
        });
        req.on("end", () => {
            let payload: BinaryLike & {
                example: string;
            };
            try {
                payload = JSON.parse(Buffer.concat(body).toString());
            } catch {
                this.respond(res, 400);
                
                return;
            }
            
            const signature = Buffer.from([ req.headers["x-hub-signature-256"] ].flat()[0] ?? "", "utf8");
            const hmac = createHmac("sha256", this.secret);
            const digest = Buffer.from(`sha256=${hmac.update(payload).digest("hex")}`, "utf8");
            
            if(signature.length !== digest.length
            || !timingSafeEqual(digest, signature)) {
                this.respond(res, 403);
                
                return;
            }
            
            const markdownTree: IMarkdownTree = null;

            // TODO
            
            this.render(markdownTree);
            
            this.respond(res, 200);
        });
    }
    
    protected obtainMarkdownTree(): IMarkdownTree {
        return {
            filename: "",
            markdown: ""
        };
    }

    public start(): Promise<void> {
        return new Promise((resolve) => {
            this.server
            .listen(this.port, resolve);
        });
    }
};