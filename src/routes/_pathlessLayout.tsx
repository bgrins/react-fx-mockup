import { Outlet, createFileRoute } from "@tanstack/react-router";
import * as React from "react";

export const Route = createFileRoute("/_pathlessLayout")({
  component: LayoutComponent,
});

function LayoutComponent(): React.ReactElement {
  return (
    <div className="p-2">
      <div className="border-b">I&apos;m a layout</div>
      <div>
        <Outlet />
      </div>
    </div>
  );
}
