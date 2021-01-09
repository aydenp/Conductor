import morgan from "morgan";

export function setupMorganFormats() {
    const devOrig = morgan["dev"];

    // Like `dev` but better suited for proxy situations like Conductor.
    morgan.format('dev-proxy', function developmentFormatLine (tokens, req, res) {
        return morgan.compile("\x1b[34m:req[host]\x1b[0m > ")(tokens, req, res) + devOrig(tokens, req, res)
    })
}