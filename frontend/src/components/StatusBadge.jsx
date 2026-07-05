const STATUS_CONFIG = {
  PENDING:      { label: 'Pending',      className: 'badge-pending' },
  UNDER_REVIEW: { label: 'Under Review', className: 'badge-under-review' },
  RETURNED:     { label: 'Returned',     className: 'badge-returned' },
  APPROVED:     { label: 'Approved',     className: 'badge-approved' },
  REJECTED:     { label: 'Rejected',     className: 'badge-rejected' },
  COMPLETED:    { label: 'Completed',    className: 'badge-completed' },
};

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || { label: status, className: 'badge-pending' };
  return <span className={`badge ${config.className}`}>{config.label}</span>;
}
