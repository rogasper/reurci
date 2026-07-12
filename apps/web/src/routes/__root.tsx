import type { AppRouter } from "@reurci/api/routers/index";
import { Toaster } from "@reurci/ui/components/sonner";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { HeadContent, Outlet, Scripts, createRootRouteWithContext, useRouterState } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import type { TRPCOptionsProxy } from "@trpc/tanstack-react-query";

import Header from "../components/header";

import appCss from "../index.css?url";
export interface RouterAppContext {
  trpc: TRPCOptionsProxy<AppRouter>;
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "REURCI",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Switzer:wght@400;500;600;700&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),

  component: RootDocument,
});

function RootDocument() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isPublic = pathname === "/" || pathname === "/login";

  return (
    <html lang="en" className="light">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-svh bg-[--color-white-canvas] text-[--color-portrait-ink]">
        {isPublic && <Header />}
        <Outlet />
        <Toaster richColors />
        {/* <TanStackRouterDevtools position="bottom-left" /> */}
        <ReactQueryDevtools position="bottom" buttonPosition="bottom-right" />
        <Scripts />
      </body>
    </html>
  );
}
