import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"
import {toast as sonnerToast} from "sonner"

type ToastParams = {
    title: string;
    description: string;
    status: "success" | "error" | "info" | "warning";
    duration?:number;
    position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}

export const toast = (params: ToastParams)=>{
    sonnerToast[params.status](params.title, {
        description: params.description,
        duration: params.duration,
        position: params.position,
    });
}

const Toaster = ({ ...props }: ToasterProps) => {

  return (
    <Sonner
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-7" />
        ),
        info: (
          <InfoIcon className="size-7" />
        ),
        warning: (
          <TriangleAlertIcon className="size-7" />
        ),
        error: (
          <OctagonXIcon className="size-7" />
        ),
        loading: (
          <Loader2Icon className="size-7 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--error-bg": "var(--destructive)",
          "--error-text": "var(--destructive-foreground)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast min-w-[450px]! flex items-center gap-5!",
          error: "bg-red-300! text-neutral-900! border-none! [&>div>div:first-child]:font-semibold [&>div>div:first-child]:text-lg [&>div>div:last-child]:text-neutral-900! [&>div>div:last-child]:font-normal",
          success: "!bg-primary !text-primary-foreground border-none! [&>div>div:first-child]:font-semibold [&>div>div:first-child]:text-xl [&>div>div:last-child]:text-neutral-900! [&>div>div:last-child]:font-normal",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
