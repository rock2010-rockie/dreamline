import './global.css'
import type { ReactNode } from 'react'
import LayoutWrapper from './components/LayoutWrapper'

export const metadata = {
  title: 'DREAMLINE',
  description: '청소년 진로 멘토링 앱',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  )
}