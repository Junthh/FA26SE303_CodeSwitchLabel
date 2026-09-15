import { Suspense } from "react";
import { Routes } from "react-router-dom";

import { renderRoutes } from "./routes";

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        {renderRoutes()}
      </Routes>
    </Suspense>
  );
}

export default App;