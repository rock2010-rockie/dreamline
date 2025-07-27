'use client'

import { usePathname } from 'next/navigation'
import Header from './Header'
import Navbar from './Navbar'
import { ReactNode } from 'react'

export default function LayoutWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const noLayout =
    pathname === '/splash' ||
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/signup/student' ||
    pathname === '/signup/mentor';

  return (
    <>
      {!noLayout && <Header />}
      <main style={{ paddingBottom: noLayout ? 0 : '60px' }}>
        {children}
      </main>
      {!noLayout && <Navbar />}
    </>
  );
}
