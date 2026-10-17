# Rule: internalSearch

## Rule 정보

- **Rule 이름**: `ACDL - internalSearch - Send Beacon`
- **이벤트**: `internalSearch`

## Trigger

- [ ] Extension: **Adobe Client Data Layer**
- [ ] Event Key: `event` equals `internalSearch`

## Actions

- [ ] **Adobe Analytics → Set Variables**
  - `s.pageName` = `검색결과`
  - `s.prop7` = `%ACDL - Search Term%`
  - `s.eVar13` = `%ACDL - Search Term%`
  - `s.eVar14` = Custom Code: `event._aa.eVar14`
  - `s.events` = `event2`
- [ ] **Adobe Analytics → Send Beacon**

## Data Elements

| 이름 | 소스 |
|------|------|
| ACDL - Search Term | `event.search.term` |

## 검증

- [ ] 검색어 입력 시 Rule 실행
- [ ] Internal Search Term 리포트에서 검색어 확인
