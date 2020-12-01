import { Injectable } from '@kitcon/core/annotations';
import { KeyAnyType } from '@kitcon/core/key-any.type';
import * as path from 'path';
import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';
import { v4 } from 'uuid';
import { Exception } from '@kitcon/core/exception';

@Injectable
export class JwtService {
    publicKey: any;
    private privateKey: any;
    constructor() {
        if (fs.existsSync(path.join((global as any).ROOT_PATH, '..', 'keys', 'public.key'))) {
            console.log
            this.publicKey = fs.readFileSync(
                path.join((global as any).ROOT_PATH, '..', 'keys', 'public.key')
            );
            this.privateKey = fs.readFileSync(
                path.join((global as any).ROOT_PATH, '..', 'keys', 'private.key')
            );
        }
    }

    public unpack(token: string): KeyAnyType {
        try {
            return jwt.verify(token, this.publicKey, {
                algorithms: ['RS256']
            }) as any;
        } catch (e) {
            throw new Exception('Invalid token', 409);
        }
    }

    public createToken(data: any, expiresIn: any, jwtid?: string) {
        return jwt.sign(data, this.privateKey, {
            algorithm: 'RS256',
            expiresIn,
            jwtid: jwtid || v4()
        });
    }

}