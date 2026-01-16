import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

console.log("Main is mounting...");
const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error("Failed to find the root element");
} else {
  createRoot(rootElement).render(<App />);
  console.log("App rendered");
}
