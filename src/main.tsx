import { StrictMode } from 'react'
// ACDL 초기화는 Layout.tsx useMountOnce에서 호출됨
// BrowserRouter + 라우트 테이블은 App.tsx에서 구성
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
