const express = require('express')
const proxy = require('express-http-proxy');
const natUpnp = require("nat-upnp");
const PublicError = require("./PublicError");

const config = require("../config");
const app = express();

const allDestinationHosts = {};
for (var host of Object.keys(config.destinations)) {
    const dest = config.destinations[host];
    allDestinationHosts[host] = typeof dest === "number" ? ("localhost:" + dest) : dest;
}

/// - Request Handling:

// Get destination information
app.use((req, res, next) => {
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
app.use(proxy((req) => req.proxyHost, { memoizeHost: false }));

// Handle errors
app.use((err, req, res, next) => {
    console.error("[Proxy Error]", err.message);
    if (err.isPublic === true || err.code == "ECONNREFUSED") return res.status(500).type("text").send("Conductor Error:\n" + err.message);
    res.sendStatus(500);
});

/// - Start Server:
app.listen(config.serverPort, () => {
    console.log(`[Server] Conductor ready to handle connections for ${Object.keys(allDestinationHosts).length} destination(s) on port ${config.serverPort}!`);
    
    /// - Port Forwarding:

    if (config.automaticallyForwardPort !== false) {
        const externalPort = typeof config.automaticallyForwardPort === "number" ? config.automaticallyForwardPort : 80;
        console.log(`[Port Forwarding] Trying to forward port on external port ${externalPort}...`);
        
        // Use UPnP to attempt to port forward Conductor on the network's router
        const upnpClient = natUpnp.createClient();
        upnpClient.portMapping({
            public: externalPort,
            private: config.serverPort,
            ttl: 0
        }, (err) => {
            if (err) return console.error("[Port Forwarding] Conductor could not be forwarded on your router:", err);
            // Try and get external IP to show user external address
            upnpClient.externalIp((err, ip) => {
                console.log("[Port Forwarding] Port forwarded on your router successfully!", ip ? `Externally accessible at http://${ip}${externalPort == 80 ? "" : `:${externalPort}`}.` : `Couldn't determine external IP address due to error: ${err.message}.`);
                console.log("[Port Forwarding] If users outside your network still can't access Conductor, your router may not properly support UPnP. Try manually port forwarding Conductor.")
            });
        });
        
        // Deregister port when we die
        var ON_DEATH = require('death')({uncaughtException: true}); //this is intentionally ugly
        var OFF_DEATH = ON_DEATH((signal, err) => {
            upnpClient.portUnmapping({ public: externalPort });
            OFF_DEATH();
            process.exit(signal);
        });
    } else {
        console.info("[Port Forwarding] If you are going to access Conductor from another network, port forward it on your network router (or enable automatic port forwarding in config.js).");
    }
});