export declare class TemplateService {
    private templates;
    constructor();
    private initializeTemplates;
    private registerHelpers;
    render(templateName: string, context: any): Promise<string>;
    renderText(templateName: string, context: any): Promise<string>;
}
