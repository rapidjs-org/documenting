import { IncomingHttpHeaders } from "http";
import { createHmac, timingSafeEqual } from "crypto";

import { APushAgent } from "./APushAgent";


export class GHPushAgent extends APushAgent<{
    secret?: string;
}> {
    protected writeTempDir(payload: string, headers: IncomingHttpHeaders): void | Promise<void> {
        const signature = Buffer.from([ headers["x-hub-signature-256"] ].flat()[0] ?? "", "utf8");
        const hmac = createHmac("sha256", this.options.secret);
        const digest = Buffer.from(`sha256=${hmac.update(payload).digest("hex")}`, "utf8");
        
        if(signature.length !== digest.length
        || !timingSafeEqual(digest, signature)) {
            throw new Error("Authentication failed");
        }

        // TODO
    }
}