// Shapes returned by the public WooCommerce Store API on teb-sanat.com
// (https://teb-sanat.com/wp-json/wc/store/v1/...). Only the fields this
// importer actually reads are declared — the real API returns more.

export interface TebSanatCategory {
  id: number;
  name: string;
  slug: string;
  count: number;
}

export interface TebSanatAttributeTerm {
  id: number;
  name: string;
  slug: string;
}

export interface TebSanatAttribute {
  id: number;
  name: string;
  taxonomy: string;
  terms: TebSanatAttributeTerm[];
}

export interface TebSanatImage {
  id: number;
  src: string;
  name: string;
  alt: string;
}

export interface TebSanatProduct {
  id: number;
  name: string;
  slug: string;
  type: string;
  permalink: string;
  sku: string;
  short_description: string;
  description: string;
  images: TebSanatImage[];
  categories: Array<{ id: number; name: string; slug: string }>;
  attributes: TebSanatAttribute[];
}

// The taxonomy teb-sanat uses for every product's size attribute.
export const SIZE_ATTRIBUTE_TAXONOMY = 'pa_سایز-بندی';
