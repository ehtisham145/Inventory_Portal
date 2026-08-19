export interface Column<T> {
  header: string;
  render: (row: T) => React.ReactNode;
  className?: string;
}

interface SelectionProps {
  selectedIds: Set<string>;
  onToggleRow: (id: string) => void;
  onToggleAll: () => void;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  keyField: (row: T) => string;
  selection?: SelectionProps;
}

export function DataTable<T>({ columns, rows, keyField, selection }: DataTableProps<T>) {
  const allSelected = selection ? rows.length > 0 && rows.every((row) => selection.selectedIds.has(keyField(row))) : false;

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            {selection && (
              <th className="w-10 whitespace-nowrap px-4 py-3 text-left">
                <input
                  type="checkbox"
                  aria-label="Select all rows"
                  checked={allSelected}
                  onChange={selection.onToggleAll}
                  className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900/20"
                />
              </th>
            )}
            {columns.map((col) => (
              <th
                key={col.header}
                className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {rows.map((row) => {
            const id = keyField(row);
            return (
              <tr key={id} className="hover:bg-gray-50">
                {selection && (
                  <td className="w-10 px-4 py-3 align-middle">
                    <input
                      type="checkbox"
                      aria-label="Select row"
                      checked={selection.selectedIds.has(id)}
                      onChange={() => selection.onToggleRow(id)}
                      className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900/20"
                    />
                  </td>
                )}
                {columns.map((col) => (
                  <td
                    key={col.header}
                    className={`whitespace-nowrap px-4 py-3 align-middle text-gray-800 ${col.className ?? ""}`}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
