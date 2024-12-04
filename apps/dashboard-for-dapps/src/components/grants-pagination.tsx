import { HStack, PaginationNextTrigger, PaginationPrevTrigger } from "@chakra-ui/react";
import { PaginationItems, PaginationRoot } from "./ui/pagination";

export default function GrantsPagination({
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
