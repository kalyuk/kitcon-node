import { Injectable } from '@kitcon/core/annotations';
import { Container } from '@kitcon/core/container';

export function Bootstrap(target: any) {

    Injectable(target);

    const container = new Container();
    container.get(target);


}