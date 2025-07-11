import type { JSX } from "react";

export default function Options(): JSX.Element {
  return (
    <div id="my-ext" className="container" data-theme="light">
      Options
      <button type="button" className="btn btn-outline">
        Default
      </button>
      <button type="button" className="btn btn-outline btn-primary">
        Primary
      </button>
      <button type="button" className="btn btn-outline btn-secondary">
        Secondary
      </button>
      <button type="button" className="btn btn-outline btn-accent">
        Accent
      </button>
    </div>
  );
}
