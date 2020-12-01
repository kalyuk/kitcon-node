import { Injectable, resolve } from '@kitcon/core/annotations';
import * as http from 'http';
import { RouteService } from './route.service';
import * as url from 'url';
import * as qs from 'qs';
import { ContextInterface } from '../context';
import { JwtService } from './jwt.service';

@Injectable
export class HttpService {

    @resolve
    private routeService: RouteService;

    @resolve
    private jwtService: JwtService;

    private readonly server = http.createServer();

    private readBody = async (request: http.IncomingMessage) => {
        return new Promise(resolve => {
            let body = '';
            request.on('data', function (data) {
                body += data;
                if (body.length > 1e6)
                    request.connection.destroy();
            });

            request.on('end', function () {
                resolve(JSON.parse(body));
            });
        })
    }

    init() {
        this.on('request', async (request, response) => {
            const params = url.parse(request.url);

            const context: ContextInterface = {
                query: qs.parse(params.query)
            }

            if (request.method === 'POST' || request.method === 'PUT') {
                try {
                    context.body = await this.readBody(request);
                } catch (e) {
                    response.statusCode = 409;
                    response.end("unsupported body")
                    return;
                }
            }


            if (request.headers.authorization && request.headers.authorization.slice(0, 6) === "Bearer") {
                try {
                    context.meta = { user: this.jwtService.unpack(request.headers.authorization.replace('Bearer ', '')) };
                } catch (e) {
                    response.statusCode = 409;
                    response.write(JSON.stringify(e));
                    return response.end();
                }
            }

            const pattern = request.method + ' ' + params.pathname;
            const result = await this.routeService.run(pattern, context);
            response.statusCode = result.status;


            Object
                .keys(result.getHeaders())
                .forEach(header => {
                    response.setHeader(header, result.getHeaders()[header])
                })

            response.write(result.getBody());
            response.end();
        });
    }

    on(eventName: string, fn: (request: http.IncomingMessage, response: http.ServerResponse) => void) {
        this.server.on(eventName, fn);
    }

    async listen(port: number = 2016, host: string = '0.0.0.0'): Promise<void> {
        return new Promise(resolve => {
            this.server.listen(port, host, () => {
                console.info(`application started at ${port} port`)
                resolve();
            });
        })
    }
}