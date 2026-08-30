# subinhong.dev

포트폴리오 사이트. 정적 HTML·CSS·JS 로 빌드 도구 없이 서빙한다.

## 배포

Cloudflare Pages 가 이 저장소의 `main` 을 보고 있다. push 하면 반영된다.
빌드 명령은 없고 저장소 루트를 그대로 낸다.

| | |
|---|---|
| 도메인 | `subinhong.dev` |
| 호스팅 | Cloudflare Pages |
| 빌드 | 없음 — 정적 파일 그대로 |

데모 서비스는 `ticket.subinhong.dev` 에 따로 있고 그쪽은 홈랩 클러스터에서 돈다.
홈랩은 매일 23:30 에 꺼지고 07:30 에 켜지므로 그 사이에는 데모가 응답하지 않는다.
이 사이트는 그와 무관하게 상시 뜬다.

## 구조

```
index.html      진입
README.md
```
