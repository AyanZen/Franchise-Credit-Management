import React from "react";
import MotionBackground from "../layout/MotionBackground";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="fp-app">
          <MotionBackground />
          <div className="fp-center" style={{ flexDirection: "column", gap: 16, zIndex: 1, position: "relative" }}>
            <div style={{ fontWeight: 600, fontSize: 16 }}>Something went wrong</div>
            <div style={{ fontSize: 14, color: "#6b7280", maxWidth: 420, textAlign: "center" }}>
              {String(this.state.error.message || this.state.error)}
            </div>
            <button className="btn btn-primary" onClick={() => this.setState({ error: null })}>Try again</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
