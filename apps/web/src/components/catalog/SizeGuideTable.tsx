import type { SizeGuideSection } from "@/data/size-guide";

export function SizeGuideTable({ section }: { section: SizeGuideSection }) {
  if (section.rows.length === 0) return null;
  return (
    <div className="overflow-x-auto">
      <table className="w-full overflow-hidden rounded-lg border border-border text-sm">
        <thead className="bg-primary/10 text-navy">
          <tr>
            <th className="px-3 py-2 text-start font-semibold">سایز</th>
            {section.columns.map((column) => (
              <th key={column} className="px-3 py-2 text-start font-semibold">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {section.rows.map((row) => (
            <tr key={row.size} className="border-t border-border">
              <td className="px-3 py-2 font-medium text-navy">{row.size}</td>
              {row.values.map((value, i) => (
                <td key={section.columns[i] ?? i} className="px-3 py-2 text-secondary-text">
                  {value}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
