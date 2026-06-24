import { useState, useEffect } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const usePagination = (initialLimit = 20, filterDependencies: any[] = []) => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(initialLimit);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setPage(1); }, filterDependencies);

  const offset = (page - 1) * limit;

  return { page, setPage, limit, setLimit, offset };
};
