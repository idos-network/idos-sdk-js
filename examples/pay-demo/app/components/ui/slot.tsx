import * as React from 'react';

type SlotProps = React.HTMLAttributes<HTMLElement> & {
  children?: React.ReactNode;
  asChild?: boolean;
};

const Slot = React.forwardRef<HTMLElement, SlotProps>(
  ({ asChild, children, ...props }, ref) => {
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, {
        ...props,
        ...children.props,
        ref,
      });
    }

    return (
      <span ref={ref as React.Ref<HTMLSpanElement>} {...props}>
        {children}
      </span>
    );
  }
);

Slot.displayName = 'Slot';

export { Slot };

