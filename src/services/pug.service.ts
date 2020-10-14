import { Injectable } from '@kitcon/core/annotations';
import * as pug from 'pug';
import * as path from 'path';
import { Response } from '../response';

@Injectable
export class PugService {
    private options: any;
    constructor(params: any = {}) {
        this.options = {
            cache: true,
            ...params
        }
    }

    render(filepath: string, params: any = {}): Response {
        let body = '';
        const filename = `${filepath}.pug`;
        try {
            console.log(path.join('views', filename));
            body = pug.render(
                {
                    ...this.options,
                    ...params,
                    filename: path.join('views', filename)
                });

        } catch (e) {
            console.log(e);
        }

        console.log('=====>', body)

        const response = new Response(200, body);
        response.setHeader('Content-Type', 'text/html; charset=UTF-8')

        return response;
    }
}