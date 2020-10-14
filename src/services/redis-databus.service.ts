import { EventEmitter } from 'events';
import * as Redis from 'ioredis';
import { v4 } from 'uuid';
import { ContextInterface } from '../context';
import { DatabusService } from './abstract/databus.service';
import { RouteService } from './route.service';
import { Response } from '../response';
import { resolve } from '@kitcon/core/annotations';
import { Exception } from '@kitcon/core/exception';

export const BROADCAST_CHANNEL = 'BROADCAST_CHANNEL';
export interface IRequest {
    pattern: string;
    ctx: ContextInterface;
    meta: {
        serviceName: string;
        clientId: string;
        responseId: string;
        responseChannel: string;
    };
}

export interface IResponse {
    status: number;
    body: any;
    meta: {
        responseId: string;
    }
}

export class RedisDatabusService extends DatabusService {

    public static readonly RESPONSE_TIMEOUT = 30;
    public readonly sender = new Redis(process.env.REDIS_URL);
    public readonly listener = new Redis(process.env.REDIS_URL);
    public readonly clientId: string = v4();
    private readonly emitter = new EventEmitter();
    private readonly responseSuffix: string = v4();
    private readonly reposneRegexp = new RegExp(this.responseSuffix + '$')

    @resolve
    private readonly routeService: RouteService;

    constructor(public readonly serviceName: string) {
        super();
    }

    public init() {
        const channels = [this.serviceName, this.clientId, BROADCAST_CHANNEL];
        this.subscribe(...channels);
    }

    public listen() {
        this.listener.on('message', this.handle);
    }

    public send(channelName: string, pattern: string, ctx: ContextInterface): Promise<any> {
        return new Promise((resolve, reject) => {
            const request: IRequest = {
                ctx,
                meta: {
                    clientId: this.clientId,
                    responseChannel: `${this.clientId}-${this.responseSuffix}`,
                    responseId: v4(),
                    serviceName: this.serviceName
                },
                pattern
            }

            const timeout = setTimeout(() => {
                this.emitter.removeAllListeners(request.meta.responseId);
                reject(new Exception('timeout', 408));
            }, RedisDatabusService.RESPONSE_TIMEOUT * 1000);

            this.emitter.once(request.meta.responseId, data => {
                clearTimeout(timeout);
                resolve(data)
            });

            this.sender.publish(channelName, JSON.stringify(request));
        });

    }

    public subscribe(...channels: string[]): void {
        const chls = [...channels, channels.map(c => `${c}-${this.responseSuffix}`)]
        this.listener.subscribe(...chls as any);

        console.log(`Redis start listen channels (${chls.join(', ')})`)
    }

    private handle = (channel: string, data: string): void => {
        const body = JSON.parse(data);

        if (this.reposneRegexp.test(channel)) {
            this.response(body);
        } else {
            this.request(body);
        }
    };

    private response(response: IResponse) {
        this.emitter.emit(response.meta.responseId, new Response(response.status, response.body));
    }

    private async request(request: IRequest) {
        const response: any = await this.routeService.run(request.pattern, { ...request.ctx, meta: request.meta })

        this.sender.publish(request.meta.responseChannel, JSON.stringify({
            ...response.toJSON(),
            meta: {
                responseId: request.meta.responseId
            }
        }));
    }
}
