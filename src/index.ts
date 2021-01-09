import express from "express";
import morgan from "morgan";
import proxy from "express-http-proxy";

import { Request } from "./types";
import { PortForwarder } from "./port-forwarding";
import { PublicError } from "./util/PublicError";
import { setupMorganFormats } from "./util/morgan-setup";

const config = require("../config");
const app = express();

const allDestinationHosts: { [host: string]: string } = {};
for (var host of Object.keys(config.destinations)) {
    const dest = config.destinations[host];
    allDestinationHosts[host] = typeof dest === "number" ? ("localhost:" + dest) : dest;
}

/// - Request Handling:

// Setup request logging
if (config.requestLogging === true || typeof config.requestLogging === "string") {
    setupMorganFormats()
    app.use(morgan(typeof config.requestLogging === "string" ? config.requestLogging : 'dev-proxy'));//':remote-addr - [:date[clf]] ":method :url HTTP/:http-version" on :req[host] :status :res[content-length]'));
}

// Get destination information
app.use((req: Request, res, next) => {
    // Determine destination port to use for this request
    req.proxyHost = allDestinationHosts[req.hostname];
    if (!req.proxyHost) return next(new PublicError(`No destination was found for the host: ${req.hostname}. Check the destinations in your Conductor configuration file.`));

    next();
});

// Add header for debugging
app.use((req, res, next) => {
    res.header("X-Forwarded-By", "Conductor");
    next();
});

// Proxy requests
app.use(proxy((req: Request) => req.proxyHost, { limit: '100mb', memoizeHost: false }));

// Handle errors
app.use((err, req, res, next) => {
    console.error("[Proxy Error]", err.message);
    if (err.isPublic === true || err.code == "ECONNREFUSED") return res.status(500).type("text").send("Conductor Error:\n" + err.message);
    res.sendStatus(500);
});

/// - Start Server:
app.listen(config.serverPort, async () => {
    console.log(`[Server] Conductor ready to handle HTTP requests for ${Object.keys(allDestinationHosts).length} destination(s) on port ${config.serverPort}!`);
    
    /// - Port Forwarding:

    if (config.automaticallyForwardPort !== false) {
        const externalPort = typeof config.automaticallyForwardPort === "number" ? config.automaticallyForwardPort : 80;
        console.log(`[Port Forwarding] Trying to forward port on external port ${externalPort}...`);

        // Use UPnP to attempt to port forward Conductor on the network's router
        const portForwarder = new PortForwarder(externalPort, config.serverPort);
        try {
            const externalIP = await portForwarder.mapPort();
            console.log("[Port Forwarding] Port forwarded on your router successfully!", `Externally accessible at http://${externalIP}${externalPort == 80 ? "" : `:${externalPort}`}.`);
            console.log("[Port Forwarding] If users outside your network still can't access Conductor, your router may not properly support UPnP. Try manually port forwarding Conductor.")
        } catch (err) {
            console.error("[Port Forwarding] Conductor could not be forwarded on your router:", err);
        }
    } else {
        console.info("[Port Forwarding] If you are going to access Conductor from another network, port forward it on your network router (or enable automatic port forwarding in config.js).");
    }
});
