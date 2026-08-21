export interface PublicProductSuggestion {
  type: 'product';
  id: string;
  label: string;
  slug: string;
  brand: string | null;
  image: string | null;
}

export interface PublicSubcategorySuggestion {
  type: 'subcategory';
  label: string;
  slug: string;
}

export interface PublicBrandSuggestion {
  type: 'brand';
  label: string;
  slug: string;
}

export type PublicSuggestion =
  PublicProductSuggestion | PublicSubcategorySuggestion | PublicBrandSuggestion;
