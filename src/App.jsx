import AppRouter from "./routes/AppRouter";

import Loader from "./shared/components/Loader"
import ToastProvider from "./shared/components/ToastProvider"

function App() {

  return (
    <>
      <Loader />
      <ToastProvider />
      <AppRouter />
    </>
  );
}

export default App;