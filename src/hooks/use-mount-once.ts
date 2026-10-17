import { useEffect, useRef } from "react"

/**
 * effect를 컴포넌트당 정확히 1회만 실행합니다.
 * React StrictMode의 개발 모드 mount→cleanup→mount 이중 호출로 인해
 * 실제 Adobe Analytics/Launch 비콘이 중복 발생하는 것을 막기 위한 가드입니다.
 */
export function useMountOnce(effect: () => void): void {
  const firedRef = useRef(false)

  useEffect(() => {
    if (firedRef.current) return
    firedRef.current = true
    effect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
