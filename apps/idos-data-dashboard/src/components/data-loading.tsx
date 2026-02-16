import { Spinner } from "@/components/ui/spinner";

export function DataLoading() {
  return (
    <div className="flex items-center gap-5 p-5">
      <span className="text-sm">Loading...</span>
      <Spinner className="size-6" />
    </div>
  );
}
