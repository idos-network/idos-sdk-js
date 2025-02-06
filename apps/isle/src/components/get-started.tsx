import { Button } from "./button";

export default function GetStarted({
  stepperLine,
  onClick,
}: { onClick: () => void; stepperLine: JSX.Element }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      <h1 className="font-semibold text-2xl">Get started in 3 steps.</h1>
      {stepperLine}
      <div className="flex w-full flex-col gap-2">
        <Button onClick={onClick}>Connect idOS profile</Button>
        <Button>
          <div className="flex items-center gap-2">
            <span>Link existing wallet</span>
            <img src="/wallet.svg" alt="wallet" />
          </div>
        </Button>
      </div>
    </div>
  );
}
