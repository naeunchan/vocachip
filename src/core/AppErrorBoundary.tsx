import { Component, type ErrorInfo, type ReactNode } from "react";

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError() {
    return {
      hasError: true,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("App render failed", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="app-shell">
          <main className="screen-body">
            <section className="content-card app-error-card" role="alert">
              <h3>화면을 다시 불러와 주세요</h3>
              <p>검색 결과를 표시하는 중 문제가 생겼어요.</p>
              <button
                className="search-definition-more-button"
                type="button"
                onClick={() => window.location.reload()}
              >
                다시 불러오기
              </button>
            </section>
          </main>
        </div>
      );
    }

    return this.props.children;
  }
}
