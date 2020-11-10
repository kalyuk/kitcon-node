import { Exception } from '@kitcon/core/exception';

export function ACL(permissions: number | number[]) {
    return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
        const method = descriptor.value;

        descriptor.value = function (ctx: any) {
            if (ctx.meta && ctx.meta.user && ctx.meta.user.permissions) {
                let count = 0;
                const $permissions = Array.isArray(permissions) ? permissions : [permissions];
                $permissions.forEach(p => {

                    if (ctx.meta.user.permissions.includes(p)) {
                        count++;
                    }
                });
                
                if (count === $permissions.length) {
                    return method.call(this, ctx);
                }
            }
            throw new Exception('Permissions deny', 403)
        }
    }
}