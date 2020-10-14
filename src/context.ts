import { KeyAnyType } from '@kitcon/core/key-any.type';

export interface ContextInterface {
    params?: KeyAnyType;
    body?: KeyAnyType;
    headers?: KeyAnyType;
    query?: KeyAnyType;
    meta?: KeyAnyType;
}