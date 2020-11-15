import { Injectable } from '@kitcon/core/annotations';
import * as Hashids from 'hashids';

@Injectable
export class HashService {

    // @ts-ignore
    private readonly hash = new Hashids(process.env.HASH_SALT || '', 6, 'abcdefghijklmnopqrstuvwxyz1234567890');

    encode(value: number) {
        return this.hash.encode(value);
    }

    decode(key: string) {
        return this.hash.decode(key)[0];
    }

}