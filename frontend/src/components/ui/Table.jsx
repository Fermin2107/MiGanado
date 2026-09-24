import { useState } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import './ui.css';

export default function Table({
  columns = [],
  rows = [],
  onRowClick,
  // Server-side sort: when provided, disables client-side sorting
  sortKey: extSortKey,
  sortDir: extSortDir,
  onSort,
}) {
  const serverSide = onSort != null;

  const [intSortKey, setIntSortKey] = useState(null);
  const [intSortDir, setIntSortDir] = useState('asc');

  const activeSortKey = serverSide ? extSortKey : intSortKey;
  const activeSortDir = serverSide ? extSortDir : intSortDir;

  const handleHeaderClick = (col) => {
    if (!col.sortable) return;
    const newDir = activeSortKey === col.key ? (activeSortDir === 'asc' ? 'desc' : 'asc') : 'asc';
    if (serverSide) {
      onSort(col.key, newDir);
    } else {
      setIntSortKey(col.key);
      setIntSortDir(newDir);
    }
  };

  const sorted = serverSide || !intSortKey
    ? rows
    : [...rows].sort((a, b) => {
        const va = a[intSortKey] ?? '';
        const vb = b[intSortKey] ?? '';
        const cmp = va < vb ? -1 : va > vb ? 1 : 0;
        return intSortDir === 'asc' ? cmp : -cmp;
      });

  const SortIcon = ({ col }) => {
    if (!col.sortable) return null;
    if (activeSortKey !== col.key)
      return <ChevronsUpDown size={13} style={{ opacity: 0.4, marginLeft: 4, flexShrink: 0 }} />;
    return activeSortDir === 'asc'
      ? <ChevronUp   size={13} style={{ marginLeft: 4, flexShrink: 0 }} />
      : <ChevronDown size={13} style={{ marginLeft: 4, flexShrink: 0 }} />;
  };

  return (
    <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={col.sortable ? 'sortable' : ''}
                onClick={() => handleHeaderClick(col)}
                style={{ width: col.width }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                  {col.header}
                  <SortIcon col={col} />
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr
              key={row.id ?? i}
              onClick={() => onRowClick?.(row)}
              style={{ cursor: onRowClick ? 'pointer' : undefined }}
            >
              {columns.map((col) => (
                <td key={col.key} className={col.mono ? 'mono' : ''}>
                  {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
