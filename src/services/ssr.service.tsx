import * as React from 'react';
import { Injectable, resolve } from '@kitcon/core/annotations';
import { StaticRouter } from 'react-router';
import { renderToString } from 'react-dom/server';
import { renderRoutes, RouteConfig } from 'react-router-config';
import { PugService } from './pug.service';
import { LocationService } from '@kitcon/ui/services/location.service';
import { DataService } from '@kitcon/ui/services/data.service';
import { Context } from '@kitcon/ui/context';
import { Container } from '@kitcon/core/container';

@Injectable
export class SsrService {

    @resolve
    private readonly pugService: PugService;

    @resolve
    private readonly locationService: LocationService;

    @resolve
    private readonly dataService: DataService;

    async render(pages: RouteConfig[], templateName: string, options: any) {

        this.locationService.handleChangeLocation({
            pathname: options.path
        });

        await this.dataService.load(pages);

        const context: any = {};
        const session = new Container();
        
        const body = renderToString(
            <Context.Provider value={session}>
                <StaticRouter context={context} location={options.path}>
                    {renderRoutes(pages)}
                </StaticRouter>
            </Context.Provider>
        );

        session.destroy();

        return this.pugService.render(templateName, { body });

    }
}