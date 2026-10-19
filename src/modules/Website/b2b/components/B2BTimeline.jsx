import B2BStatusBadge from "./B2BStatusBadge";

/**
 * Vertical status-history timeline for a B2B enquiry / bulk order.
 * `history` is expected to be an array of
 *   { status, remarks, createdDate }
 * ordered oldest → newest (rendered newest-first).
 */
const B2BTimeline = ({ history }) => {
  if (!history || history.length === 0) {
    return <p className="b2b-timeline-empty">No status updates yet.</p>;
  }

  const events = [...history].reverse();

  return (
    <div className="b2b-timeline">
      {events.map((event, idx) => (
        <div className="b2b-timeline-item" key={event.id ?? idx}>
          <div className="b2b-timeline-dot" />
          <div className="b2b-timeline-content">
            <div className="b2b-timeline-header">
              <B2BStatusBadge status={event.status} />
              <span className="b2b-timeline-date">
                {event.createdDate
                  ? new Date(event.createdDate).toLocaleString()
                  : ""}
              </span>
            </div>
            {event.remarks && (
              <p className="b2b-timeline-remarks">{event.remarks}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default B2BTimeline;
