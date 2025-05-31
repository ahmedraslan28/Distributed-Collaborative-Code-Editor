import "./App.css";
import Register from "./pages/Register";
import CodeEditor from "./pages/CodeEditor";
import ProtectedRouter from "./middleware/ProtectedRouter";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  return (
    <Router>
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        <Route path="/" element={<Register />} />
        <Route
          path="/code/:roomId"
          element={
            <ProtectedRouter>
              {" "}
              <CodeEditor />{" "}
            </ProtectedRouter>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
