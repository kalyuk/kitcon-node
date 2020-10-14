export class Response {
    private headers = {
        "Content-Type": "application/json"
    };

    constructor(public status: number, private body: any = null) {

    }

    setHeader(header: string, value: string | number) {
        this.headers[header] = value;
    }

    getHeaders() {
        return this.headers;
    }

    getBody() {
        if (this.headers["Content-Type"] === "application/json") {
            return JSON.stringify(this.body);
        }
        return this.body;
    }

    setBody(body: any) {
        this.body = body;
    }

    toJSON() {
        return {
            body: this.body,
            status: this.status,
            header: this.headers
        }
    }
}
