import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { Provider } from "jotai";
import "./index.css";
import reportWebVitals from "./reportWebVitals";

const root = ReactDOM.createRoot(document.getElementById("root"));
if (typeof window !== "undefined") {
  const observerErrHandler = () => {
    const observerError = 'ResizeObserver loop completed with undelivered notifications.';
    window.addEventListener("error", (e) => {
      if (e.message === observerError) {
        e.stopImmediatePropagation();
      }
    });
  };

  observerErrHandler();
}
root.render(
  <React.StrictMode>
    <Provider>
      <App />
    </Provider>
  </React.StrictMode>
);

reportWebVitals();
