import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./style.css";
class Boundary extends React.Component<
  React.PropsWithChildren,
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <main>
        <h1>Bir görüntüleme hatası oluştu.</h1>
        <p>Kaydedilen verilerin korunuyor.</p>
        <button onClick={() => location.reload()}>Yeniden aç</button>
      </main>
    ) : (
      this.props.children
    );
  }
}
createRoot(document.getElementById("root")!).render(
  <Boundary>
    <App />
  </Boundary>,
);
