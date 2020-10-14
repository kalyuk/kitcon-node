import { Injectable } from '@kitcon/core/annotations';

export function Controller() {
    return <T>(target: T): T & { renderTemplate: (path: string) => string } => {
        Injectable(target);
        return target as any;

    }
}