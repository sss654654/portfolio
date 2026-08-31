# subinhong.dev

포트폴리오 사이트. Jekyll + [Hydejack](https://hydejack.com) 테마(free v9).

## 배포

Cloudflare Pages 가 이 저장소의 `main` 을 보고 빌드한다.

| | |
|---|---|
| 도메인 | `subinhong.dev` |
| 호스팅 | Cloudflare Pages |
| 빌드 명령 | `jekyll build` |
| 출력 디렉터리 | `_site` |
| Ruby | `.ruby-version` 의 3.2.2 |

## 로컬 확인

WSL 에 Ruby 가 없으므로 Docker 로 빌드한다.

```
docker run --rm -v <이 폴더>:/srv -w /srv ruby:3.2 \
  bash -c "bundle install && bundle exec jekyll build"
```

## 구조

```
_config.yml     사이트 설정 (이름·메뉴·색)
index.md        현관
homelab.md      홈랩 (대표)
projects.md     프로젝트 목록 (_projects/ 카드)
resume.md       이력서
_projects/      카드 4장 — homelab · cgv · semiai · leveldb
assets/img/     avatar.jpg(사이드바) · photo.jpg(원본)
```

데모 서비스는 `ticket.subinhong.dev` 에 따로 있고 홈랩 클러스터에서 돈다.
홈랩은 매일 23:30 에 꺼지고 07:30 에 켜지므로 그 사이에는 데모가 응답하지 않는다.
이 사이트는 그와 무관하게 상시 뜬다.
