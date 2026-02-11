import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

import { auth } from "@/auth";
import { db } from "@/db";
import { PositionPopup } from "@/components/position-popup";
import { eq } from "drizzle-orm";
import { users as usersTable } from "@/db/schema";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CCMS - Coaching Management System",
  description: "Modern Coaching Platform",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  let showPopup = false;
  let allPositions: any[] = [];

  if (session?.user?.id) {
    const user = await db.query.users.findFirst({
      where: eq(usersTable.id, session.user.id),
    });

    if (user && !user.positionId) {
      showPopup = true;
      allPositions = await db.query.positions.findMany();
    }
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          {showPopup && <PositionPopup positions={allPositions} initialOpen={true} />}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
