import { getMetadataStorage } from 'class-validator';

export function value(key: string = '') {
    return (target: any, propertyKey: string | symbol, parameterIndex: number) => {
        const values = Reflect.getMetadata('values', target.constructor, propertyKey) || [];
        const types = Reflect.getMetadata('design:paramtypes', target, propertyKey);
        const Type = types[parameterIndex];
        const isRequired = Type && getMetadataStorage().getTargetValidationMetadatas(Type, null).length > 0;

        values[parameterIndex] = [key, Type, isRequired];

        Reflect.defineMetadata('values', values, target.constructor, propertyKey);
    }
}
