const B2BStats = ({ dashboard }) => {

  const stats = [

    {
      title: "Total Enquiries",
      value: dashboard?.total || 0
    },

    {
      title: "Pending Review",
      value: dashboard?.submitted || 0
    },

    {
      title: "Under Review",
      value: dashboard?.underReview || 0
    },

    {
      title: "Quotation Sent",
      value: dashboard?.quotationSent || 0
    },

    {
      title: "Accepted",
      value: dashboard?.accepted || 0
    },

    {
      title: "Orders",
      value: dashboard?.orders || 0
    },

    {
      title: "Shipped",
      value: dashboard?.shipped || 0
    },

    {
      title: "Delivered",
      value: dashboard?.delivered || 0
    }

  ];

  return (

    <div className="b2b-stats-grid">

      {stats.map((item) => (

        <article className="b2b-stat-card" key={item.title}>

          <div className="b2b-stat-label">
            {item.title}
          </div>

          <div className="b2b-stat-value">
            {item.value}
          </div>

        </article>

      ))}

    </div>

  );
};

export default B2BStats;