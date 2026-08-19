import { Button } from "@/components/ui/Button";

interface PaginationProps {
  page: number;
  hasNext: boolean;
  hasPrevious: boolean;
  onPageChange: (page: number) => void;
  totalCount?: number;
  pageSize?: number;
}

export function Pagination({ page, hasNext, hasPrevious, onPageChange, totalCount, pageSize = 20 }: PaginationProps) {
  const totalPages = totalCount ? Math.ceil(totalCount / pageSize) : undefined;

  return (
    <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
      <span className="text-xs text-gray-500">
        Page {page}
        {totalPages ? ` of ${totalPages}` : ""}
        {totalCount !== undefined ? ` · ${totalCount} total` : ""}
      </span>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" disabled={!hasPrevious} onClick={() => onPageChange(page - 1)}>
          Previous
        </Button>
        <Button variant="secondary" size="sm" disabled={!hasNext} onClick={() => onPageChange(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}
