import { HStack } from "@chakra-ui/react";
import {
  PaginationItems,
  PaginationNextTrigger,
  PaginationPrevTrigger,
  PaginationRoot,
} from "./ui/pagination";

export function Pagination({
  count,
  pageSize,
  page,
  setPage,
}: { count: number; pageSize: number; page: number; setPage: (page: number) => void }) {
  return (
    <PaginationRoot
      count={count}
      pageSize={pageSize}
      page={page}
      onPageChange={({ page }) => setPage(page)}
    >
      <HStack>
        <PaginationPrevTrigger />
        <PaginationItems />
        <PaginationNextTrigger />
      </HStack>
    </PaginationRoot>
  );
}
