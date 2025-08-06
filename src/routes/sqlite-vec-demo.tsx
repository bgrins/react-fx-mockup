import { createFileRoute } from "@tanstack/react-router";
import { SqliteVecDemo } from "~/components/SqliteVecDemo";

export const Route = createFileRoute("/sqlite-vec-demo")({
  component: SqliteVecDemoPage,
});

function SqliteVecDemoPage() {
  return <SqliteVecDemo />;
}
