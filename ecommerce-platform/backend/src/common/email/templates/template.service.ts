// backend/src/common/email/templates/template.service.ts
import { Injectable } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import * as handlebars from 'handlebars';
import { orderConfirmationTemplate } from './order-confirmation.template';

@Injectable()
export class TemplateService {
  private templates: Record<string, handlebars.TemplateDelegate> = {};

  constructor() {
    this.initializeTemplates();
    this.registerHelpers();
  }

  private initializeTemplates() {
    // Register compiled templates
    this.templates['order-confirmation'] = handlebars.compile(orderConfirmationTemplate);
    // Add other templates here
  }

  private registerHelpers() {
    // Format currency helper
    handlebars.registerHelper('formatCurrency', (value: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(value);
    });

    // Format date helper
    handlebars.registerHelper('formatDate', (date: Date, format: string) => {
      if (!date) return '';
      const d = new Date(date);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    });
  }

  async render(templateName: string, context: any): Promise<string> {
    const template = this.templates[templateName];
    if (!template) {
      throw new Error(`Template ${templateName} not found`);
    }
    return template(context);
  }

  async renderText(templateName: string, context: any): Promise<string> {
    // For text-only emails, we can either:
    // 1. Have separate text templates
    // 2. Strip HTML from the rendered template
    // 3. Generate text from context
    // This is a simple implementation that strips HTML tags
    const html = await this.render(templateName, context);
    return html.replace(/<[^>]*>?/gm, '');
  }
}