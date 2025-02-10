import * as motion from "motion/react-client";
import { type PropsWithChildren, useState } from "react";
import { DisconnectedIcon } from "./icons/disconnected";
import { Logo } from "./logo";

export default function Minimized({ children }: PropsWithChildren) {
  const [isExpanded, setIsExpanded] = useState(false);
  return (
    <motion.div
      style={{
        display: "flex",
        gap: 1,
        borderRadius: "46px",
        width: "74px",
        height: "42px",
        alignItems: "start",
        backgroundColor: "#27272a", // @todo: change to theme color
      }}
      whileHover={{
        width: "366px",
        height: "200px",
        borderRadius: "38px",
        backgroundColor: "transparent",
        padding: "12px",
      }}
      onMouseEnter={() =>
        setTimeout(() => {
          setIsExpanded(true);
        }, 200)
      }
      onMouseLeave={() => setIsExpanded(false)}
    >
      {isExpanded ? (
        children
      ) : (
        <motion.div
          style={{
            padding: "4px",
            display: "flex",
            gap: 1,
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <Logo size="sm" />
          <DisconnectedIcon color="gray.500" />
        </motion.div>
      )}
    </motion.div>
  );
}
