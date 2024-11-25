"use client";

import {
  CheckIcon,
  DocumentCheckIcon,
  FingerPrintIcon,
  HandThumbUpIcon,
  UserIcon,
} from "@heroicons/react/20/solid";
import { usePathname, useRouter } from "next/navigation";
import { useContext, useEffect } from "react";
import { CurrentContext } from "../lib/current";

const timeline = [
  {
    id: 1,
    content: "Wallet login",
    icon: UserIcon,
    path: "/steps/wallet",
  },
  {
    id: 2,
    content: "Identity verification",
    path: "/steps/kyc",
    icon: DocumentCheckIcon,
  },
  {
    id: 3,
    content: "idOS setup",
    path: "/steps/idos",
    icon: FingerPrintIcon,
  },
  {
    id: 4,
    content: "idOS share grant",
    path: "/steps/share",
    icon: HandThumbUpIcon,
  },
  {
    id: 5,
    content: "Done",
    path: "/steps/done",
    icon: CheckIcon,
  },
];

function classNames(...classes: (string | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export default function Progress() {
  const { current, path } = useContext(CurrentContext);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (path && path !== pathname) router.push(path);
  }, [path, pathname, router]);

  if (!current) return null;

  const dagAvailable = current.application?.grantee && current.application?.publicEncryptionKey;

  const activeIndex = timeline.findIndex((event) => event.path === pathname);

  const currentTimeline = timeline.filter((x) => x.id != 4 || dagAvailable);

  return (
    <div className="flow-root">
      <ul role="list" className="-mb-8">
        {currentTimeline.map((event, eventIdx) => (
          <li key={event.id}>
            <div className="relative pb-8">
              {eventIdx !== currentTimeline.length - 1 ? (
                <span
                  aria-hidden="true"
                  className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"
                />
              ) : null}
              <div className="relative flex space-x-5">
                <div>
                  <span
                    className={classNames(
                      eventIdx === activeIndex ? "bg-orange-300" : null,
                      eventIdx < activeIndex ? "bg-green-500" : null,
                      eventIdx > activeIndex ? "bg-gray-400" : null,
                      "flex h-8 w-8 items-center justify-center rounded-full ring-8 ring-white",
                    )}
                  >
                    <event.icon aria-hidden="true" className="h-5 w-5 text-white" />
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 justify-between space-x-5 pt-1.5">
                  <div
                    className={classNames(
                      "text-black",
                      eventIdx === activeIndex ? "font-bold" : undefined,
                    )}
                  >
                    {event.content}
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
