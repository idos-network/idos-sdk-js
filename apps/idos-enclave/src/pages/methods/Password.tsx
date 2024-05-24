import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import { Button } from "../../components/Button";
import { Heading } from "../../components/Heading";
import { Input } from "../../components/Input";
import { Paragraph } from "../../components/Paragraph";
import { MethodProps } from "./Chooser";

export default function Password({
  mode,
  onSuccess,
  store,
}: MethodProps<{ password: string; duration: number }>) {
  const [password, setPassword] = useState("");
  const [duration, setDuration] = useState(7);
  const passwordInput = useRef<{ focus: () => void }>(null);

  useEffect(() => {
    passwordInput.current?.focus();
  }, [passwordInput]);

  const onSubmit = useCallback(
    (e: Event) => {
      e.preventDefault();
      e.stopPropagation();

      store.set("preferred-auth-method", "password");

      onSuccess({ password, duration });
    },
    [password, duration],
  );

  const passwordField = (
    <Input
      ref={passwordInput}
      type="password"
      required={true}
      onInput={(e) => setPassword(e.currentTarget.value)}
    />
  );

  const durationField = (
    <div className="flex flex-col">
      <p className="font-semibold text-left">Remember for:</p>
      <div class="flex items-center mt-2 gap-x-6">
        <label className="gap-x-2 flex items-center cursor-pointer">
          <input
            type="radio"
            name="duration"
            value="7"
            class="form-radio text-green-400 cursor-pointer"
            checked={duration === 7}
            onInput={() => setDuration(7)}
          />
          <span>1 week</span>
        </label>
        <label className="gap-x-2 flex items-center cursor-pointer">
          <input
            type="radio"
            name="duration"
            value="30"
            class="form-radio text-green-400 cursor-pointer"
            checked={duration === 30}
            onInput={() => setDuration(30)}
          />
          <span>1 month</span>
        </label>
      </div>
    </div>
  );

  return (
    <form className="flex flex-col space-y-4 px-5 md:px-0" onSubmit={onSubmit}>
      {mode == "new" && (
        <>
          <Heading>Create your idOS key</Heading>

          <Paragraph>
            Please choose a secure password, store it safely, and enter it below:
          </Paragraph>

          {passwordField}

          {durationField}

          <Paragraph>
            This password is the key to your idOS data. Be careful not to lose it: you'll need it
            later to view or share you idOS data.
          </Paragraph>

          <Button type="submit">Create password</Button>
        </>
      )}

      {mode == "existing" && (
        <>
          <Heading>Unlock your idOS key</Heading>

          <Paragraph>Please enter your idOS password below:</Paragraph>

          {passwordField}

          {durationField}

          <Button type="submit">Unlock</Button>
        </>
      )}
    </form>
  );
}
