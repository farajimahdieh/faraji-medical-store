// Real variant sizes are a mix of standard letter sizes and free-text
// range descriptions imported verbatim from teb-sanat.com (e.g. "از شماره
// 36 تا 45"). Standard sizes sort in their usual order; everything else
// sorts alphabetically after them; "تک سایز" (one-size) always sorts last,
// since it doesn't belong on the same scale as the rest.
const STANDARD_SIZE_ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

const FREE_SIZE_LABEL = 'تک سایز';

export function compareSizes(a: string, b: string): number {
  if (a === b) return 0;
  if (a === FREE_SIZE_LABEL) return 1;
  if (b === FREE_SIZE_LABEL) return -1;

  const indexA = STANDARD_SIZE_ORDER.indexOf(a);
  const indexB = STANDARD_SIZE_ORDER.indexOf(b);
  if (indexA !== -1 && indexB !== -1) return indexA - indexB;
  if (indexA !== -1) return -1;
  if (indexB !== -1) return 1;

  return a.localeCompare(b, 'fa');
}
