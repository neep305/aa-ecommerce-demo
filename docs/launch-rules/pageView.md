# Rule: pageView

## Rule 정보

- **Rule 이름**: `ACDL - pageView - Send Beacon`
- **이벤트**: `pageView`

## Trigger

- [ ] Extension: **Adobe Client Data Layer**
- [ ] Event Type: **Specific Event**
- [ ] Event Key: `event`
- [ ] Operator: **equals**
- [ ] Value: `pageView`

## Conditions (선택)

- [ ] `page.channel` equals `ecommerce` (선택)

## Actions

- [ ] **Adobe Analytics → Set Variables**
  - `s.pageName` = `%ACDL - Page Name%`
  - `s.channel` = `%ACDL - Channel%`
  - `s.prop1` = `%ACDL - Page Name%`
  - `s.eVar1` = `%ACDL - Channel%`
  - `s.events` = `%ACDL - Events%` (값: `event1`)
- [ ] **Adobe Analytics → Send Beacon**

## Data Elements 필요

| 이름 | 소스 |
|------|------|
| ACDL - Page Name | `event._aa.pageName` |
| ACDL - Channel | `event._aa.channel` |
| ACDL - Events | `event._aa.events` |

## 검증

- [ ] 홈페이지 로드 시 Rule 실행 (Adobe Debugger)
- [ ] Report Suite에서 pageName, channel 수신 확인
