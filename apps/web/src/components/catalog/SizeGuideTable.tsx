import type { SizeGuideSection } from "@/data/size-guide";

export function SizeGuideTable({ section }: { section: SizeGuideSection }) {
  if (section.rows.length === 0) return null;
  return (
    <table className="w-full overflow-hidden rounded-lg border border-border text-sm">
      <thead className="bg-primary/10 text-navy">
        <tr>
          <th className="px-3 py-2 text-start font-semibold">سایز</th>
          <th className="px-3 py-2 text-start font-semibold">اندازه ({section.unit})</th>
        </tr>
      </thead>
      <tbody>
        {section.rows.map((row) => (
          <tr key={row.size} className="border-t border-border">
            <td className="px-3 py-2 font-medium text-navy">{row.size}</td>
            <td className="px-3 py-2 text-secondary-text">{row.range}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
