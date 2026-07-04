import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cn } from "@reurci/ui/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-[28px] border font-medium whitespace-nowrap outline-none select-none focus-visible:ring-1 focus-visible:ring-[#08304c]/20 disabled:pointer-events-none disabled:opacity-40 active:opacity-80 transition-opacity [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-[#08304c] text-white border-transparent hover:opacity-90",
        outline:
          "bg-white text-[#08304c] border-[#353535]/20 hover:bg-[#e8f1ff] hover:border-[#084e72]/30",
        secondary:
          "bg-[#e8f1ff] text-[#08304c] border-transparent hover:bg-[#d7e8fe]",
        ghost:
          "bg-transparent text-[#08304c] border-transparent hover:bg-[#e8f1ff]",
        destructive:
          "bg-transparent text-red-600 border-transparent hover:bg-red-50",
        rainbow:
          "bg-white text-[#08304c] border-transparent bg-[linear-gradient(#fff,#fff)_padding-box,linear-gradient(90deg,#26c0ff,#e600c2_20%,#ff4940_40%,#ffa130_60%,#ffc837_80%,#00cc3d)_border-box] border-[1.5px] hover:opacity-80",
        link: "bg-transparent text-[#08304c] border-transparent underline-offset-4 hover:underline",
      },
      size: {
        default: "h-8 gap-1.5 px-3 text-xs",
        xs: "h-6 gap-1 px-2 text-[11px]",
        sm: "h-7 gap-1 px-2.5 text-xs",
        lg: "h-10 gap-1.5 px-4 text-sm",
        icon: "size-8",
        "icon-xs": "size-6",
        "icon-sm": "size-7",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
