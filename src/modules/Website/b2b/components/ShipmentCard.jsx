const ShipmentCard = ({ shipment }) => {

  if (!shipment) {

    return (

      <div className="shipment-card">

        <h3>
          Shipment
        </h3>

        <p>
          Shipment information is not
          available yet.
        </p>

      </div>

    );

  }


  return (

    <div className="shipment-card">

      <h3>
        Shipment
      </h3>


      <div className="shipment-row">

        <span>
          Courier
        </span>

        <strong>
          {shipment.courierName || "-"}
        </strong>

      </div>


      <div className="shipment-row">

        <span>
          Tracking Number
        </span>

        <strong>
          {shipment.trackingNumber || "-"}
        </strong>

      </div>


      <div className="shipment-row">

        <span>
          Expected Delivery
        </span>

        <strong>
          {shipment.expectedDeliveryDate
            ? new Date(
                shipment.expectedDeliveryDate
              ).toLocaleDateString()
            : "-"
          }
        </strong>

      </div>


      {shipment.trackingUrl && (

        <a
          href={shipment.trackingUrl}
          target="_blank"
          rel="noreferrer"
          className="track-button"
        >
          Track Shipment
        </a>

      )}

    </div>

  );

};

export default ShipmentCard;