import React, { useState, useMemo } from 'react';
import './DataTable.css';

interface Column {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  onRowClick?: (row: any) => void;
  onDelete?: (id: string) => void;
  loading?: boolean;
}

export const DataTable: React.FC<DataTableProps> = ({
  columns,
  data,
  onRowClick,
  onDelete,
  loading = false,
}) => {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Filter data
  const filteredData = useMemo(() => {
    return data.filter((row) => {
      return columns.every((col) => {
        if (!col.filterable || !filters[col.key]) return true;
        const value = String(row[col.key] || '').toLowerCase();
        const filterValue = filters[col.key].toLowerCase();
        return value.includes(filterValue);
      });
    });
  }, [data, filters, columns]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];
      
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });
  }, [filteredData, sortColumn, sortDirection]);

  // Paginate data
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return sortedData.slice(start, end);
  }, [sortedData, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(sortedData.length / rowsPerPage);

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const handleFilterChange = (columnKey: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [columnKey]: value,
    }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleRowsPerPageChange = (value: number) => {
    setRowsPerPage(value);
    setCurrentPage(1); // Reset to first page
  };

  if (loading) {
    return <div className="table-loading">Loading...</div>;
  }

  return (
    <div className="data-table-wrapper">
      {/* Filters */}
      <div className="table-filters">
        {columns
          .filter((col) => col.filterable)
          .map((col) => (
            <div key={col.key} className="table-filter">
              <label>{col.label}:</label>
              <input
                type="text"
                placeholder={`Filter ${col.label}...`}
                value={filters[col.key] || ''}
                onChange={(e) => handleFilterChange(col.key, e.target.value)}
                className="filter-input"
              />
            </div>
          ))}
      </div>

      {/* Rows per page selector */}
      <div className="table-controls">
        <div className="rows-per-page">
          <label>Rows per page:</label>
          <select
            value={rowsPerPage}
            onChange={(e) => handleRowsPerPageChange(Number(e.target.value))}
            className="rows-select"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
        <div className="table-info">
          Showing {paginatedData.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} to{' '}
          {Math.min(currentPage * rowsPerPage, sortedData.length)} of {sortedData.length} entries
        </div>
      </div>

      {/* Table */}
      {paginatedData.length === 0 ? (
        <div className="table-empty">No data available</div>
      ) : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={col.sortable ? 'sortable' : ''}
                    onClick={() => col.sortable && handleSort(col.key)}
                  >
                    <div className="th-content">
                      {col.label}
                      {col.sortable && (
                        <span className="sort-indicator">
                          {sortColumn === col.key
                            ? sortDirection === 'asc'
                              ? ' ↑'
                              : ' ↓'
                            : ' ⇅'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
                {onDelete && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((row, idx) => (
                <tr
                  key={row.id || idx}
                  onClick={() => onRowClick?.(row)}
                  className={onRowClick ? 'clickable' : ''}
                >
                  {columns.map((col) => (
                    <td key={col.key}>
                      {col.render
                        ? col.render(row[col.key], row)
                        : row[col.key] || '-'}
                    </td>
                  ))}
                  {onDelete && (
                    <td onClick={(e) => e.stopPropagation()}>
                      <button
                        className="delete-btn"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this item?')) {
                            onDelete(row.id);
                          }
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="table-pagination">
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <div className="pagination-info">
            Page {currentPage} of {totalPages}
          </div>
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

