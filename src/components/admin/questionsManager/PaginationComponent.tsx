import React from 'react';

interface PaginationComponentProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

const PaginationComponent: React.FC<PaginationComponentProps> = ({ 
  currentPage, 
  totalPages, 
  totalItems, 
  pageSize, 
  onPageChange, 
  onPageSizeChange 
}) => {
  const getPageNumbers = () => {
    const pages = [];
    const showPages = 5; // Show 5 page numbers at a time
    
    let start = Math.max(1, currentPage - Math.floor(showPages / 2));
    const end = Math.min(totalPages, start + showPages - 1);
    
    if (end - start + 1 < showPages) {
      start = Math.max(1, end - showPages + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Items info */}
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            Showing <span className="font-medium text-gray-900">{((currentPage - 1) * pageSize) + 1}</span> to <span className="font-medium text-gray-900">{Math.min(currentPage * pageSize, totalItems)}</span> of <span className="font-medium text-gray-900">{totalItems}</span> questions
          </div>
          
          {/* Page size selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
                onPageChange(1); // Reset to first page when changing page size
              }}
              className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* Pagination controls */}
        <div className="flex items-center gap-1">
          {/* First page button */}
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-l-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title="First page"
          >
            ««
          </button>

          {/* Previous button */}
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border-t border-b border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Previous page"
          >
            ‹
          </button>

          {/* Page numbers */}
          {(() => {
            const pageNumbers = getPageNumbers();
            const showFirstPage = pageNumbers[0] > 1;
            const showLastPage = pageNumbers[pageNumbers.length - 1] < totalPages;
            const showFirstEllipsis = pageNumbers[0] > 2;
            const showLastEllipsis = pageNumbers[pageNumbers.length - 1] < totalPages - 1;

            return (
              <>
                {showFirstPage && (
                  <>
                    <button
                      onClick={() => onPageChange(1)}
                      className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border-t border-b border-gray-300 hover:bg-gray-50"
                    >
                      1
                    </button>
                    {showFirstEllipsis && (
                      <span className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border-t border-b border-gray-300">
                        ...
                      </span>
                    )}
                  </>
                )}

                {pageNumbers.map(page => (
                  <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    className={`px-3 py-2 text-sm font-medium border-t border-b border-gray-300 ${
                      currentPage === page
                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                        : 'bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                {showLastPage && (
                  <>
                    {showLastEllipsis && (
                      <span className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border-t border-b border-gray-300">
                        ...
                      </span>
                    )}
                    <button
                      onClick={() => onPageChange(totalPages)}
                      className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border-t border-b border-gray-300 hover:bg-gray-50"
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </>
            );
          })()}

          {/* Next button */}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border-t border-b border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Next page"
          >
            ›
          </button>

          {/* Last page button */}
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-r-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Last page"
          >
            »»
          </button>
        </div>
      </div>
      
      {/* Mobile-friendly pagination info */}
      <div className="mt-3 sm:hidden text-center">
        <span className="text-sm text-gray-500">
          Page {currentPage} of {totalPages}
        </span>
      </div>
    </div>
  );
};

export default PaginationComponent;
