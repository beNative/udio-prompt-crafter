export interface Tag {
  id: string;
  label: string;
  description: string;
  synonyms?: string[];
  example_snippet?: string;
  conflictsWith?: string[];
  implies?: string[];
  emoji?: string;
  color?: 'red' | 'orange' | 'yellow' | 'green' | 'teal' | 'blue' | 'indigo' | 'purple' | 'pink' | 'gray';
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  type?: 'tags' | 'text';
  tags: Tag[];
}

export type Taxonomy = Category[];

export interface SelectedTag extends Tag {
  categoryId: string;
  impliedBy?: string; // ID of the tag that implied this one
  implyingTagLabel?: string; // Label of the tag that implied this one
}

export interface Preset {
  name:string;
  selectedTags: Record<string, Omit<SelectedTag, 'id' | 'label' | 'description' | 'synonyms' | 'example_snippet' | 'conflictsWith' | 'implies' | 'emoji' | 'impliedBy' | 'implyingTagLabel' | 'color'>>;
  categoryOrder: string[];
}

export interface Conflict {
  tagA: Tag;
  tagB: Tag;
}

export interface UDIOParams {
    promptStrength: number;
    remixDifference: number;
}

export interface Macro {
    name: string;
    description: string;
    tags: string[];
}