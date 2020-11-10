import { Injectable } from '@kitcon/core/annotations';
import * as pug from 'pug';
import * as path from 'path';
import * as fs from 'fs';
import { Response } from '../response';

@Injectable
export class PugService {
    private options: any;
    constructor(params: any = {}) {
        this.options = {
            cache: process.env.NODE_ENV === 'development',
            ...params
        }
    }

    render(filepath: string, params: any = {}): Response {
        let body = '';
        const filename = `${filepath}.pug`;
        try {
            body = pug.renderFile(
                path.join(path.join(global.ROOT_PATH, 'server'), 'views', filename),
                {
                    ...this.options,
                    ...params,
                }
            )

        } catch (e) {
            console.error(e);
        }

        const response = new Response(200, body);
        response.setHeader('Content-Type', 'text/html; charset=UTF-8')

        return response;
    }
}