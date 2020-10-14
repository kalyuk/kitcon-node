import { plainToClass } from 'class-transformer';
import { validateSync } from 'class-validator';
import { Exception } from '@kitcon/core/exception';
import { ContextInterface } from '../context';
import { RouteService } from '../services/route.service';

export function endpoint(pattern: string) {
    return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
        RouteService.register(target.constructor);
        const endpoints = Reflect.getMetadata('endpoints', target.constructor) || {};

        endpoints[propertyName] = { pattern, response: Reflect.getMetadata('design:returntype', target, propertyName) };
        Reflect.defineMetadata('endpoints', endpoints, target.constructor);
        Reflect.defineMetadata('design:returntype', Reflect.getMetadata('design:returntype', target, propertyName), target.constructor, propertyName);

        const values = Reflect.getMetadata('values', target.constructor, propertyName) || [];
        const method = descriptor.value;

        // tslint:disable-next-line:only-arrow-functions
        descriptor.value = function (ctx: ContextInterface) {
            const args = [];

            values.forEach(([key, Type, isRequired]) => {
                const data = key.split('.').reduce((o: any, i: string) => o[i] || o, ctx);
                const value = Type ? plainToClass(Type, data) : data;
                if (isRequired && Type && value) {
                    const tmpErrors = validateSync(value);
                    const errors = {};
                    if (tmpErrors.length) {
                        tmpErrors.forEach(({ property, constraints }) => {
                            errors[property] = constraints[Object.keys(constraints)[0]]
                        });

                        throw new Exception('Invalid input data', 409, errors);

                    }
                    args.push(value);
                } else if (value) {
                    args.push(value);
                }
            });

            if (!values.lenght) {
                args.push(ctx);
            }

            return method.apply(this, args);
        };
    }
}
