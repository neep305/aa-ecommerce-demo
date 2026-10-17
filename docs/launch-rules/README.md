# Launch Rule 체크리스트

이벤트별 Adobe Tags(Launch) Rule 설정 체크리스트입니다. Launch UI에서 아래 항목을 재현하세요.

## 공통 사전 작업

- [ ] Adobe Client Data Layer Extension 설치
- [ ] Adobe Analytics Extension 설치 (Report Suite 연결)
- [ ] Data Element 생성 (implementation-launch-extension.md 참고)
- [ ] Rule Publish (Development → Staging → Production)

## 이벤트별 Rule

| 이벤트 | 파일 |
|--------|------|
| pageView | [pageView.md](./pageView.md) |
| prodView | [prodView.md](./prodView.md) |
| scAdd | [scAdd.md](./scAdd.md) |
| scRemove | [scRemove.md](./scRemove.md) |
| scView | [scView.md](./scView.md) |
| scCheckout | [scCheckout.md](./scCheckout.md) |
| purchase | [purchase.md](./purchase.md) |
| internalSearch | [internalSearch.md](./internalSearch.md) |
| promoClick | [promoClick.md](./promoClick.md) |

## Rule 명명 규칙 (권장)

```
ACDL - {EventName} - Send Beacon
```

예: `ACDL - pageView - Send Beacon`
