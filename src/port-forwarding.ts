import natUpnp from "nat-upnp";
import { promisify } from "util";

var ON_DEATH = require('death')({uncaughtException: true}); //this is intentionally ugly

export class PortForwarder {
    private upnpClient: natUpnp.Client;
    private deathBinding: any;

    constructor(private externalPort: number, private serverPort: number) {
        this.upnpClient = natUpnp.createClient();
    }

    private get mappingOptions() {
        return {
            public: this.externalPort,
            private: this.serverPort,
            ttl: 0,
            protocol: "tcp"
        }
    }

    async mapPort() {
        try {
            return await this._mapPort();
        } catch (err) {
            // Try once to remove mappings and re-map. Give up if it fails.
            await this.removeExistingMappings();
            return await this._mapPort();
        }
    }

    private async _mapPort(): Promise<string> {
        await promisify(this.upnpClient.portMapping).bind(this.upnpClient)(this.mappingOptions);
        this.bindToDeath();
        return await promisify(this.upnpClient.externalIp).bind(this.upnpClient)()
    }

    async unmapPort() {
        await promisify(this.upnpClient.portUnmapping).bind(this.upnpClient)(this.mappingOptions);
        this.removeDeathBinding();
    }

    private async removeExistingMappings() {
        await promisify(this.upnpClient.portUnmapping).bind(this.upnpClient)({ public: this.externalPort });
    }

    // MARK: - Death Bindings

    private bindToDeath() {
        this.deathBinding = ON_DEATH(async (signal) => {
            try {
                await this.unmapPort();
            } catch (err) {
                console.error("Couldn't un-UPnP map port:", err);
            }
            process.exit(signal);
        });
    }

    private removeDeathBinding() {
        if (!this.deathBinding) return;
        this.deathBinding();
        this.deathBinding = null;
    }
}