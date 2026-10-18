import type { Metadata } from "next";
import {AppProvider} from "@/components/AppProvider"
import "./globals.css";

export const metadata: Metadata = {
  title: "Saper",
  description: "saper w next.js",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pl"
      data-theme="dark"
      data-skin="violet-night"
      data-cell-style="raised"
      data-cell-size="medium"
      data-animations="on"
      suppressHydrationWarning
    >
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
     </html>  
   );
}



