export interface CustomTheme {
  id: string;
  name: string;
  colors: Record<string, string>;
}

export const getCustomTemplateById = (id: string): CustomTheme | null => null;
