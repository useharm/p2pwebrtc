import { Route, Routes } from "react-router";
import NotFound from "./pages/NotFound";
import Main from "./pages/Main";
import Room from "./pages/Room";


function App() {
  return (
    <Routes>
      <Route path="*" element={<NotFound />} />
      <Route exact path="/" element={<Main />} />
      <Route path="/room/:id" element={<Room />} />
    </Routes>
  );
}

export default App;
