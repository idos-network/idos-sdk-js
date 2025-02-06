import { Button } from "./button";

export function NotConnected() {
  return (
    <div className="w-full">
      <div className="flex flex-col">
        <h3 className="text-center font-bold text-xl leading-md">Own your data.</h3>
        <img src="/idos-locks.svg" alt="idOS locks" className="mt-3" />
      </div>
      <div className="mx-auto mt-4 grid w-full place-items-center">
        <Button class="w-full">Connect idOS profile</Button>
      </div>
    </div>
  );
}
