import { ChevronLeft, ChevronRight } from 'lucide-react';
import './ui.css';

function buildPageList(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, '…', total];
  if (current >= total - 3) return [1, '…', total - 4, total - 3, total - 2, total - 1, total];
  return [1, '…', current - 1, current, current + 1, '…', total];
}

export default function Pagination({ page, totalPages, perPage, total, onPageChange, onPerPageChange }) {
  if (totalPages <= 1 && total <= perPage) return null;

  const pages = buildPageList(page, totalPages);
  const from = (page - 1) * perPage + 1;
  const to   = Math.min(page * perPage, total);

  return (
    <div className="pagination">
      <span className="pagination-info">
        {from}–{to} de {total} animales
      </span>

      <div className="pagination-pages">
        <button
          className="page-btn"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Página anterior"
        >
          <ChevronLeft size={15} />
        </button>

        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`e-${i}`} className="page-ellipsis">…</span>
          ) : (
            <button
              key={p}
              className={`page-btn${p === page ? ' active' : ''}`}
              onClick={() => onPageChange(p)}
            >
              {p}
            </button>
          )
        )}

        <button
          className="page-btn"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Página siguiente"
        >
          <ChevronRight size={15} />
        </button>
      </div>

      <select
        className="per-page-select"
        value={perPage}
        onChange={(e) => onPerPageChange(Number(e.target.value))}
        aria-label="Resultados por página"
      >
        {[10, 25, 50, 100].map((n) => (
          <option key={n} value={n}>{n} por página</option>
        ))}
      </select>
    </div>
  );
}
