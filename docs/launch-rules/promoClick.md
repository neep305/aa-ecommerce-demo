# Rule: promoClick

## Rule 정보

- **Rule 이름**: `ACDL - promoClick - Send Beacon`
- **이벤트**: `promoClick`

## Trigger

- [ ] Extension: **Adobe Client Data Layer**
- [ ] Event Key: `event` equals `promoClick`

## Actions

- [ ] **Adobe Analytics → Set Variables**
  - `s.prop8` = `%ACDL - Promo Name%`
  - `s.eVar15` = `%ACDL - Promo Name%`
  - `s.eVar16` = Custom Code: `event._aa.eVar16`
  - `s.events` = `event3`
- [ ] **Adobe Analytics → Send Beacon** (Link Tracking)

## Data Elements

| 이름 | 소스 |
|------|------|
| ACDL - Promo Name | `event.promo.name` |
| ACDL - Promo Position | `event.promo.position` |

## 검증

- [ ] 프로모 배너 클릭 시 Rule 실행
- [ ] event3 카운트 증가 확인
