module.exports = {
    /**
     * **Server Port:**  
     * The port that Conductor should receive connections on.
     * 
     * @type number
     */
    serverPort: 2583,

    /**
     * **Automatic Port Forwarding:**  
     * If enabled, Conductor will automatically forward itself on your router so that it can be accessed from the internet.
     * 
     * If set to true, it will be forwarded on external port 80. You can also provide your own port as the value here.
     * 
     * @type boolean or number (external port number to forward)
     */
    automaticallyForwardPort: false,

    /**
     * **Destination List:**  
     * A list of hosts and the corresponding internal port to forward connections to.
     * 
     * @type object (key: host, value: port)
     */
    destinations: {
        "example.ayden.tech": 1234,
        "example2.ayden.tech": 1235
    },

    /**
     * **Request Logging:**  
     * If enabled, Conductor will log every request to the console.
     * 
     * The `morgan` module is used to log request. If `true` is specified, it will use a default format suited for Conductor (dev-proxy).
     * If you prefer a different format, you can specify it instead of a boolean.
     * 
     * @type boolean or string representing `morgan` configuration.
     */
    requestLogging: true
};