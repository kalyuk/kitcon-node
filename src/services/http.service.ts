import { Injectable, resolve } from '@kitcon/core/annotations';
import * as http from 'http';
import { RouteService } from './route.service';
import * as url from 'url';
import * as qs from 'qs';
import { ContextInterface } from '../context';

@Injectable
export class HttpService {

    @resolve
    private routeService: RouteService;

    private readonly server = http.createServer();

    init() {
        this.on('request', async (request, response) => {
            
            const params = url.parse(request.url);
            const context: ContextInterface = { query: qs.parse(params.query) }
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