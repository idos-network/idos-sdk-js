import { forwardRef } from "preact/compat";
import { useImperativeHandle, useRef } from "preact/hooks";

const MyInput: React.ForwardFn<React.HTMLAttributes<HTMLInputElement>, { focus(): void }> = (
  props,
  ref,
) => {
  const { className, ...other } = props;
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    focus() {
      inputRef.current?.focus();
    },
  }));

  return (
    <input
      className={`font-bold text-xl border-green-400 focus:border-green-600 ring-1 ring-inset ring-green-400 focus:ring-offset-green-500 text-neutral-950 rounded-md ${className}`}
      {...other}
      ref={inputRef}
    />
  );
};

export const Input = forwardRef(MyInput);
