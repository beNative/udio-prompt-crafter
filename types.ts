
export interface Tag {
  id: string;
  label: string;
  description: string;
  synonyms?: string[];
  example_snippet?: string;
  default_weight?: number;
  conflictsWith?: string[];
  implies?: string[];
  emoji?: string;
}

export interface Category {
  id: string;
  name: string;
  tags: Tag[];
}

export type Taxonomy = Category[];

export interface SelectedTag extends Tag {
  weight: number;
  categoryId: string;
}

export interface Preset {
  name: string;
  selectedTags: Record<string, Omit<SelectedTag, 'id' | 'label' | 'description' | 'synonyms' | 'example_snippet' | 'conflictsWith' | 'implies' | 'emoji'>>;
  categoryOrder: string[];
}

export interface Conflict {
  tagA: Tag;
  tagB: Tag;
}
