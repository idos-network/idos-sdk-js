import { useEffect } from "react";

export function useOutsideClickHandler(ref: React.RefObject<HTMLDivElement>, handler: () => void) {
  if (!ref) return;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        handler();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref, handler]);
}
