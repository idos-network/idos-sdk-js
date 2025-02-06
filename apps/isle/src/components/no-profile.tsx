import { useState } from "preact/hooks";
import { CreateIdosProfile } from "./create-idos-profile";
// import { Header } from "./header";
// import { ProfileIcon } from "./icons/profile";
import GetStarted from "./get-started";
import { Stepper } from "./stepper";

export function NotVerified() {
  const [index, setIndex] = useState<number>(-1);

  const next = () => setIndex(index + 1);
  return (
    <div className="w-full">
      {/* preback this once header PR is merged */}
      {/* <Header icon={<ProfileIcon />} badgeProps={{ children: "NO PROFILE" }} /> */}

      <div className="mt-6 flex flex-col gap-6">
        <Stepper
          index={index}
          steps={[
            {
              index: -1,
              title: "Create your idOS profile",
              description: "Sign the message in your wallet to authenticate with idOS.",
              render: (stepperLine) => <GetStarted onClick={next} stepperLine={stepperLine} />,
            },
            {
              index: 0,
              title: "Share access to your data",
              description: "Sign the message in your wallet to authenticate with idOS.",
              render: (stepperLine) => <CreateIdosProfile stepperLine={stepperLine} />,
            },
            {
              index: 1,
              title: "Verify your identity",
              description: "Sign the message in your wallet to authenticate with idOS.",
              render: (stepperLine) => <GetStarted onClick={next} stepperLine={stepperLine} />,
            },
          ]}
        />
      </div>
    </div>
  );
}
