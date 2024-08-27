import { normalize } from "path";
import { IncomingHttpHeaders, IncomingMessage, ServerResponse, createServer } from "http";

import { Renderer } from "../Renderer";
import { AAgent } from "./AAgent";


export abstract class APushAgent<O extends { [ key: string ]: unknown; }> extends AAgent {
    protected readonly options: O & {
        port: number;
    };

    constructor(options: O, renderer?: Renderer) {
        super({
            port: 6001,
            
            ...options
        }, renderer);
    }

    protected writeTempDir(_: string, __: IncomingHttpHeaders): void|Promise<void> {
        super.writeTempDir();
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
            try {
                const payload: string = Buffer.concat(body).toString();
                
                this.writeTempDir(payload, req.headers);

                this.render();

                this.respond(res, 200);
            } catch {
                this.respond(res, 400);
                
                return;
            }
        });
    }

    protected respond(res: ServerResponse, status: number) {
        res.statusCode = status;

        res.end();
    }

    public start(): Promise<void> {
        return new Promise((resolve) => {
            createServer((req: IncomingMessage, res: ServerResponse) => {
                try {
                    this.handleRequest(req, res);
                } catch(err) {
                    console.error(err);
                    
                    this.respond(res, 500);
                }
            })
            .listen(this.options.port, resolve);
        });
    }
}