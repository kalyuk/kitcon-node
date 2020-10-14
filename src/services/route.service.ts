
import { Injectable } from '@kitcon/core/annotations';
import { ClassType } from '@kitcon/core/class.type';
import { Exception } from '@kitcon/core/exception';
import { CONTAINER_CONTEXT } from '@kitcon/core/container';
import { ContextInterface } from '../context';
import { Response } from '../response';

interface IParam {
    attr: string;
    key: string;
}
export interface IPattern {
    pattern: string;
    regexp?: RegExp;
    keyParams?: IParam[];
    Controller: ClassType;
    methodName: string;
}

@Injectable
export class RouteService {
    public static register(Target: ClassType) {
        if (this.controllers.indexOf(Target) === -1) {
            this.controllers.push(Target)
        }
    }

    private static controllers = [];
    private patterns: IPattern[] = [];

    public getPatterns(): IPattern[] {
        return this.patterns;
    }

    public init() {
        this.prepareRoutes();
    }

    public async run(pattern: string, ctx: ContextInterface = {}): Promise<Response> {
        try {
            const result = await this.execute(pattern, ctx);
            if (result instanceof Response) {
                return result;
            } else {
                return new Response(200, result); 
            }
        } catch (e) {
            const response = new Response(e.code || 500);
            const message = !e.code && process.env.NODE_ENV === 'production' ? 'Oops, try again later' : e.message;
            const body = {
                message,
                errors: e.errors || {}
            }

            console.error(e)
            response.setBody(body);
            return response;
        }

    }

    public prepareRoutes(): void {
        this.patterns = [];
        RouteService.controllers
            .forEach(Controller => {
                const endpoints = Reflect.getMetadata('endpoints', Controller);
                const metadata = Reflect.getMetadata('metadata', Controller) || {};

                Object
                    .keys(endpoints)
                    .forEach(methodName => {
                        let { pattern } = endpoints[methodName];

                        if (metadata.basePath) {
                            const [method, ...rest] = pattern.split(' ');
                            pattern = `${method} ${metadata.basePath}${rest.join()}`
                        }

                        const params: IPattern = { pattern, Controller, methodName };

                        if (pattern.match(/<(.*?):(.*?)>/)) {
                            params.keyParams = [];
                            const r = pattern.replace(/<(.*?):(.*?)>/ig, (_: string, attr: string, key: string) => {
                                params.keyParams.push({ attr, key });
                                return '(' + key + ')';
                            });
                            params.regexp = new RegExp(r);
                        }

                        this.patterns.push(params);
                    });
            });

        this.patterns.sort((a: IPattern) => a.regexp ? 1 : -1);

    }

    private async execute(pattern: string, ctx: ContextInterface): Promise<any> {
        const el = this.patterns.find((item) => {
            return (!item.regexp && item.pattern === pattern) || (item.regexp && item.regexp.test(pattern));
        });

        if (!el) {
            throw new Exception(`Pattern "${pattern}" not found`, 404);
        }

        if (el.regexp) {
            if (!ctx.params) {
                ctx.params = {}
            }
            const result = el.regexp.exec(pattern);
            el.keyParams.forEach(({ attr }, index) => {
                ctx.params[attr] = result[index + 1];
            })
        }

        return this[CONTAINER_CONTEXT].get(el.Controller)[el.methodName](ctx);

    }


}
