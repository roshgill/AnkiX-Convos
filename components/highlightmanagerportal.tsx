import ReactDOM from 'react-dom';
import { HighlightManager, HighlightManagerProps } from "@/components/highlight-manager";

export function HighlightManagerPortal(HighlightManagerProps: HighlightManagerProps) {
    return ReactDOM.createPortal(
      <HighlightManager {...HighlightManagerProps} />,
      document.body
    );
}