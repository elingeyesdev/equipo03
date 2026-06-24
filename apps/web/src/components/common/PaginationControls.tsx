import React from 'react';

interface PaginationProps {
  page: number;
  limit: number;
  total: number;
  onPageChange: (newPage: number) => void;
}

export const PaginationControls: React.FC<PaginationProps> = ({ page, limit, total, onPageChange }) => {
  const totalPages = Math.ceil(total / limit) || 1;

  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-between items-center mt-4 p-4 border-t border-gray-200 dark:border-gray-700">
      <span className="text-sm text-gray-600 dark:text-gray-400">
        Mostrando {(page - 1) * limit + 1} a {Math.min(page * limit, total)} de {total} resultados
      </span>
      <div className="flex space-x-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded disabled:opacity-50 text-sm font-medium"
        >
          Anterior
        </button>
        <span className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded disabled:opacity-50 text-sm font-medium"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
};
