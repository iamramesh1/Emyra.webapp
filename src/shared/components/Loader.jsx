import { useSelector } from "react-redux";

const Loader = () => {

  const loading = useSelector(
    state => state.loader.loading
  );

  if (!loading) return null;

  return (
    <div className="loader">
      Loading...
    </div>
  );
};

export default Loader;