import type { WidgetModule, WidgetModuleLoader } from './render';

export const SDM_BASE_URL: string = import.meta.env.BASE_URL;

export const sdmWidgetModules: Record<string, WidgetModuleLoader> =
  import.meta.glob<WidgetModule>('../widgets/**/*.tsx');
