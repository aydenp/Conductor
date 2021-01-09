/**
 * An error message that can be relayed to the user safely.
 */
export class PublicError extends Error {
    public isPublic = true;

    constructor(public message: string) {
        super(message);
        this.name = "PublicError";
    }
}