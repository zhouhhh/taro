import { RecursiveTemplate } from '@tarojs/shared';
export declare class Template extends RecursiveTemplate {
    Adapter: {
        if: string;
        else: string;
        elseif: string;
        for: string;
        forItem: string;
        forIndex: string;
        key: string;
        type: string;
    };
    nativeComps: string[];
    usedNativeComps: string[];
    constructor();
    buildHeaderTemplate: (componentConfig: any) => string;
    buildTemplate: (componentConfig: any) => string;
    buildStandardComponentTemplate(comp: any): string;
    buildPlainTextTemplate(): string;
    buildAttrs(attrs: any, nodeName: any): string;
    replacePropName(name: string, value: string, _componentName?: string): string;
    getEvents(): any;
    buildPageTemplate: (baseTempPath: string) => string;
}
