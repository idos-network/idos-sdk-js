
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Ref } from "react"

import { forwardRef } from "react"
const buttonVariants = cva(
    "!px-4 focus-visible:border-ring !font-semibold bg-inherit focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 rounded-md border border-transparent bg-clip-padding text-sm font-medium focus-visible:ring-[3px] aria-invalid:ring-[3px] [&_svg:not([class*='size-'])]:size-4 inline-flex items-center justify-center whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none shrink-0 [&_svg]:shrink-0 outline-none group/button select-none",
    {
        variants: {
            variant: {
                default: "!bg-green-200 hover:!bg-green-300 !text-primary ",
                outline: "border-border bg-background hover:bg-muted hover:text-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 aria-expanded:bg-muted aria-expanded:text-foreground",
                secondary: "!bg-trueGray-700 text-secondary-foreground hover:!bg-whiteAlpha-300 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
                ghost: "hover:bg-muted hover:text-foreground dark:hover:bg-muted/50 aria-expanded:bg-muted aria-expanded:text-foreground",
                destructive: "!text-primary !bg-red-200 hover:!bg-red-300 !rounded-sm !text-sm  focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/20 text-destructive focus-visible:border-destructive/40 dark:hover:bg-destructive/30",
                destructiveOutline: "!text-red-200 hover:!bg-red-200/20 !rounded-sm !text-sm !border !border-red-200 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/20 text-destructive focus-visible:border-destructive/40 dark:hover:bg-destructive/30",
                link: "text-primary !bg-transparent hover:!bg-whiteAlpha-100 underline-offset-4 hover:underline",
            },
            size: {
                default: "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
                xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
                sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
                lg: "h-10 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
                icon: "size-8",
                "icon-xs": "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
                "icon-sm": "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
                "icon-lg": "size-9",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "lg",
        },
    }
)
export interface ButtonProps
    extends ButtonPrimitive.Props,
    VariantProps<typeof buttonVariants> {
    isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({
    className,
    variant = "default",
    size,
    isLoading = false,
    disabled,
    children,
    ...props
}: ButtonProps, ref: Ref<HTMLButtonElement>) {
    const spinnerSizeClass =
        size === "xs"
            ? "h-3 w-3"
            : size === "sm"
                ? "h-3.5 w-3.5"
                : size === "lg"
                    ? "h-5 w-5"
                    : "h-4 w-4";

    return (
        <ButtonPrimitive
            data-slot="button"
            className={cn(buttonVariants({ variant, size, className }))}
            disabled={disabled || isLoading}
            {...props}
            ref={ref}
        >
            {isLoading && (
                <Loader2
                    className={cn("animate-spin", spinnerSizeClass)}
                    aria-hidden="true"
                />
            )}
            {children}
        </ButtonPrimitive>
    );
}
);
export { Button, buttonVariants }
