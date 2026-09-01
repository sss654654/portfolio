---
layout: page
title: CI/CD
description: >
  Git 서버를 직접 세우고, 밖에서 미는 자격 없이 클러스터가 스스로 당겨가게 했습니다
permalink: /homelab/deploy/
---

<p class="hl-back" markdown="0"><a href="/homelab/">← 홈랩</a></p>

매니페스트도 인그레스 규칙도 다 서 있는데 앱 세 종이 뜨지 않았습니다 — **받아 올 이미지가 없었습니다.**
코드는 인터넷의 GitHub에 있고 이미지를 만들 곳도 둘 곳도 없어, 커밋에서 파드까지 오는 구간이 통째로 비어 있었습니다.

## Git 서버를 직접 세운다

**GitHub은 인터넷 쪽에 있고 이 클러스터는 공유기 뒤 사설 주소에 있습니다.** 그래서 GitHub이 클러스터 안의 ArgoCD를 부를 방법이 없고, ArgoCD가 GitHub을 주기적으로 다시 읽는 방식만 남습니다 — 커밋할 때마다 최대 3분을 기다렸습니다.

**Git 서버가 같은 망에 서면 그 호출이 성립합니다.** GitLab CE를 고른 이유는 하나 더 있습니다. 저장소·CI 러너·컨테이너 레지스트리가 한 제품에 들어 있어, 세 제품을 따로 세우고 그 사이마다 인증을 배선하지 않아도 됩니다.

**자리는 클러스터 밖 데스크탑입니다.** 정본이 자기가 정의하는 대상 안에 살면 대상과 함께 무너집니다 — 클러스터를 다시 세울 근거가 그 클러스터 안에 있으면 안 됩니다.

## 저장소 둘

|  | cgv-infra | cgv-onprem |
|---|---|---|
| 역할 | ArgoCD가 읽어 클러스터를 맞추는 **정본** | 이미지를 만들어 레지스트리에 올리는 **소스** |
| 브랜치 | `main` 하나 — 클러스터가 하나뿐이라 나눠도 볼 대상이 없음. 환경은 `environments/{dev,stg,prd}` 디렉터리가 가름 | `dev` 추가 — 브랜치가 이미지 태그의 앞부분이 됨. 레지스트리에 올리는 job은 dev에서만 생김 |
| 파이프라인 | 없음 — 빌드할 것이 없음 | 다섯 단. 초록이어야 머지 버튼이 열림 |
| webhook | **있음** — push하면 GitLab이 ArgoCD를 부름 | **없음** — ArgoCD가 이 저장소를 안 읽음 |
| 클러스터가 받는 것 | 매니페스트. **ArgoCD가** 당겨감 | 이미지. **노드가** 레지스트리에서 받아옴 |
| 쥐여 준 자격 | 저장소 읽기 전용 | 이미지 읽기 전용 |
{:.hl-two}

두 저장소 모두 **직접 push가 막혀 있습니다.** 설정만 걸어 두지 않고 빈 커밋을 밀어 실제로 거부되는지 확인했습니다 — 소유자도 예외가 없습니다. 합칠 때 작업 커밋을 하나로 누르므로 **MR 하나가 커밋 하나**로 남고, 되돌릴 일이 생기면 그 커밋 하나를 되돌리면 그 작업 전체가 돌아갑니다.

자격은 전부 **저장소 단위 전용 토큰**이고 할 수 있는 일이 하나씩입니다. 내 계정 토큰을 쓰면 내가 닿는 모든 프로젝트에 통하기 때문입니다. 같은 이미지 읽기 자격도 **노드 몫과 봇 몫을 따로 발급했습니다** — 하나가 새면 그것만 폐기합니다.

## 검증을 통과한 것만 이미지가 된다

`cgv-onprem`에 push하면 GitLab이 할 일 목록을 만들고, **데스크탑의 러너가** 그것을 가져가 job마다 컨테이너를 새로 띄워 돌립니다. 다섯 단이고, 앞 단이 하나라도 실패하면 뒷 단은 열리지 않습니다.

```
check     커밋에 자격이 섞였나 · 코드에 정적 결함이 있나 · 선언한 의존성이 낡았나
test      비어 있다
build     이미지를 만든다.  올리지는 않는다
scan      만든 이미지 안의 취약점을 훑는다
publish   dev 브랜치일 때만 job 이 생긴다
```

무엇을 막을지가 이 파이프라인의 설계인데, **막으려면 고칠 수 있어야 합니다.**

- 자격·코드·의존성은 전부 내가 고칠 수 있으므로 **조건 없이 막습니다**
- 이미지 안 OS 패키지의 취약점은 **수정판이 나온 것만** 막습니다. 베이스 이미지를 훑으면 아직 패치가 없는 것이 수십 개 나오는데, 손쓸 수 없는 것으로 막으면 파이프라인이 영구히 빨간불이 되고 결국 게이트를 끄게 됩니다

이 검사를 처음 켠 판에서 취약점 **72건**이 나왔습니다. 서비스마다 원인이 달랐습니다.

```
queue-go    2건    직접 import 한 적 없는 간접 의존 — 다른 라이브러리가 딸고 들어옴
booking    37건    부모 POM 하나가 수백 개 라이브러리의 버전을 정하는데 그 부모가 낡음
frontend   33건    베이스 이미지가 업스트림이 더 굽지 않는 태그 — 새로 받아도 같은 것이 옴
```

셋 다 **고정해 둔 것이 시간이 지나 낡은 것**입니다. 코드가 안 바뀌었으니 아무 신호가 없었고, 스캔이 처음으로 그 시간을 드러냈습니다. 지금은 0건입니다.

통과한 이미지에는 **커밋마다 다른 이름**이 붙습니다 — `dev-15-17dcc495`, 브랜치·파이프라인 번호·커밋 해시입니다. 이름이 왜 매번 달라야 하는지는 다음 절에서 드러납니다.

## 클러스터가 스스로 가져간다

배포를 **미는** 방식이면 파이프라인이 클러스터에 직접 명령해야 하고, 그러려면 클러스터 전권 자격이 클러스터 밖에 있어야 합니다. **당겨가는** 방식은 그 자격이 필요 없습니다 — 클러스터 안에서 도는 것들이 밖을 읽어 갈 뿐입니다.

| 누가 | 무엇을 한다 | 왜 그 주체인가 |
|---|---|---|
| **노드**의 containerd | 레지스트리에서 이미지를 받아온다 | 컨테이너는 이미지를 자기 디스크에 가진 쪽에서만 만들어짐. 어느 노드에 뜰지 모르니 셋 다 받을 수 있어야 함 |
| **image-updater** (클러스터 안) | 새 태그를 보고 `cgv-infra`의 `tag:` 한 줄을 커밋한다 | 파이프라인이 이 줄을 고치면 배포 정의 저장소에 대한 쓰기 자격이 클러스터 밖으로 나감 |
| **ArgoCD** | 그 커밋을 읽어 파드를 교체한다 | git 이 정본이고 클러스터가 따라옴 |
| **GitLab** | push 즉시 ArgoCD를 부른다 (webhook) | 안 부르면 ArgoCD가 최대 3분마다 되물음. 부르면 3초 |
{:.hl-dec}

**이미지 이름이 매번 달라야 하는 이유가 여기 있습니다.** 이름을 고정하면 `tag:` 줄이 안 변하고, 안 변하면 ArgoCD가 할 일이 없어집니다. 파드를 갈려면 결국 밖에서 클러스터에 명령해야 하고, 그 순간 이 구조가 무너집니다.

## 커밋에서 파드까지

<!-- 이 그림의 논지는 색 둘이다. 주황은 이미지가 가는 길, 파랑은 배포 정의가 가는 길.
     image-updater 에서 주황이 파랑으로 바뀌는데, 그 자리가 CI 와 CD 를 잇는 지점이다.
     그리고 아래 박스에서 위 박스로 향하는 선만 있다 — 밖에서 안으로 미는 선이 없다. -->
<figure class="hl-diagram hl-diagram-lg" markdown="0">
<svg viewBox="0 0 760 412" role="img" aria-label="데스크탑의 GitLab 안에 저장소 둘과 레지스트리가 있고, 격리망 안의 ArgoCD·image-updater·노드가 각각 그것들을 읽고 받아가는 그림. 이미지가 가는 길과 배포 정의가 가는 길이 색으로 갈려 있다">
  <defs>
    <marker id="hlm-img" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M0,0 L8,4 L0,8 z" fill="#f08c2e"/>
    </marker>
    <marker id="hlm-def" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M0,0 L8,4 L0,8 z" fill="#2f6fdb"/>
    </marker>
  </defs>

  <!-- ═══ 위 · 클러스터 밖 ═══ -->
  <rect class="hla-box" x="20" y="30" width="720" height="150" rx="6"/>
  <text class="hla-zone" x="36" y="50">데스크탑 · 클러스터 밖</text>

  <rect class="hla-inner" x="36" y="62" width="230" height="108" rx="4"/>
  <text class="hla-c" x="50" y="80">GitLab</text>

  <rect class="hla-inner" x="46" y="88" width="210" height="34" rx="3"/>
  <g class="hla-glyph" transform="translate(58,96)">
    <circle cx="4" cy="4" r="3"/><circle cx="4" cy="14" r="3"/><path d="M4,7 L4,11"/>
  </g>
  <text class="hla-s2" x="80" y="110">cgv-onprem</text>

  <rect class="hla-inner" x="46" y="128" width="210" height="34" rx="3"/>
  <g class="hla-glyph" transform="translate(58,136)">
    <circle cx="4" cy="4" r="3"/><circle cx="4" cy="14" r="3"/><path d="M4,7 L4,11"/>
  </g>
  <text class="hla-s2" x="80" y="150">cgv-infra</text>

  <rect class="hla-inner" x="310" y="88" width="160" height="60" rx="4"/>
  <g class="hla-glyph" transform="translate(322,102)">
    <circle cx="7" cy="7" r="6.5"/><path d="M4,7 L6,9.5 L10.5,4.5"/>
  </g>
  <text class="hla-t" x="348" y="114">CI 다섯 단</text>
  <text class="hla-s2" x="322" y="134">러너가 돌린다</text>

  <rect class="hla-inner" x="520" y="88" width="200" height="60" rx="4"/>
  <g class="hla-glyph" transform="translate(532,102)">
    <rect x="0" y="4" width="11" height="9"/><rect x="4" y="0" width="11" height="9"/>
  </g>
  <text class="hla-t" x="558" y="114">레지스트리</text>
  <text class="hla-s2" x="532" y="134">검증을 통과한 이미지</text>

  <line class="hla-ln-img" x1="260" y1="105" x2="304" y2="105" marker-end="url(#hlm-img)"/>
  <line class="hla-ln-img" x1="474" y1="118" x2="514" y2="118" marker-end="url(#hlm-img)"/>

  <!-- ═══ 아래에서 위로만 간다 ═══ -->
  <line class="hla-ln-def" x1="120" y1="298" x2="120" y2="176" marker-end="url(#hlm-def)"/>
  <text class="hla-a" x="128" y="206">매니페스트를 읽는다</text>

  <polyline class="hla-ln-def" points="350,298 350,248 200,248 200,176" marker-end="url(#hlm-def)"/>
  <text class="hla-a" x="252" y="266">태그 한 줄을 되쓴다</text>

  <polyline class="hla-ln-img" points="430,298 430,212 560,212 560,154" marker-end="url(#hlm-img)"/>
  <text class="hla-a" x="440" y="204">새 태그를 본다</text>

  <line class="hla-ln-img" x1="650" y1="298" x2="650" y2="154" marker-end="url(#hlm-img)"/>
  <text class="hla-a" x="658" y="204">이미지를 받는다</text>

  <!-- ═══ 아래 · 격리망 안 ═══ -->
  <rect class="hla-box" x="20" y="272" width="720" height="110" rx="6"/>
  <text class="hla-zone" x="36" y="292">k3s 클러스터 · 격리망 안</text>

  <rect class="hla-inner" x="36" y="302" width="230" height="66" rx="4"/>
  <g class="hla-glyph" transform="translate(50,318)">
    <path d="M12,3 A6,6 0 1 0 14,8"/><path d="M14,1 L14,5 L10,5"/>
  </g>
  <text class="hla-t" x="76" y="330">ArgoCD</text>
  <text class="hla-s2" x="50" y="350">git 대로 클러스터를 맞춘다</text>

  <rect class="hla-inner" x="310" y="302" width="160" height="66" rx="4"/>
  <text class="hla-t" x="322" y="330">image-updater</text>
  <text class="hla-s2" x="322" y="350">CI 와 CD 를 잇는다</text>

  <rect class="hla-inner" x="520" y="302" width="200" height="66" rx="4"/>
  <g class="hla-glyph" transform="translate(532,320)">
    <rect x="0" y="0" width="5" height="11"/><rect x="8" y="0" width="5" height="11"/><rect x="16" y="0" width="5" height="11"/>
  </g>
  <text class="hla-t" x="560" y="330">노드 3대</text>
  <text class="hla-s2" x="532" y="350">containerd 가 받는다</text>

  <!-- 범례 -->
  <circle class="hla-dot-g" cx="40" cy="400" r="4"/>
  <text class="hla-a" x="52" y="404">이미지가 가는 길</text>
  <circle class="hla-dot-v" cx="196" cy="400" r="4"/>
  <text class="hla-a" x="208" y="404">배포 정의가 가는 길</text>
</svg>
<figcaption>주황이 파랑으로 바뀌는 자리가 image-updater입니다. 그리고 아래에서 위로 가는 선만 있습니다 — 밖에서 클러스터로 미는 선이 없습니다.</figcaption>
</figure>

## 막힌 자리

| 증상 | 원인 | 조치 |
|---|---|---|
| 데스크탑에서 하루 열 번씩 뭔가가 죽음 — GitLab·브라우저·편집기가 번갈아 | Windows가 약속할 수 있는 메모리 총량이 **17.9GB**에 묶여 있었음. 디스크를 비우려고 페이지파일을 2GB로 고정해 둔 옛 설정이 남아 있었던 것 — **물리 메모리가 6.6GB 남아 있어도 새 요청이 거절됨** | 페이지파일을 12GB로. 총량 28GB. 램은 한 장도 안 바꿈 |
| 이미지 스캔 job 둘이 잠금 대기로 죽음 | 스캐너가 취약점 DB를 지키려고 캐시 디렉터리에 잠금을 검. 세 job이 한 캐시를 공유하는데 같은 판에 동시 실행 수를 2로 올림 — 동시성이 숨어 있던 공유 자원을 드러냄 | job 이름별로 캐시 폴더를 가름. 대가는 DB가 여러 벌이 되는 디스크 |
| 파이프라인 한 판이 10분 15초 | 판마다 같은 것을 다시 받고 있었음. 그런데 같은 다운로드가 **두 방에서** 일어남 — lint는 job 컨테이너 안에서, build는 소켓 너머 데스크탑 데몬에서 | 방마다 캐시를 따로 둠. 러너 볼륨과 빌드 캐시 마운트. **1분 54초** |
{:.hl-tbl}

## 결과

코드를 고쳐 머지한 다음부터는 사람 손이 없습니다.

- **러너가** 다섯 단을 돌고, 통과한 것만 이미지가 되어 레지스트리에 섭니다
- **image-updater가** 그 새 이름을 배포 정의에 커밋으로 되씁니다 — 작성자가 봇으로 찍혀 사람과 갈립니다
- **ArgoCD가** 그 커밋을 읽어 파드를 교체하고, **노드가** 자기 몫 자격으로 이미지를 받아옵니다
- **지금 무엇이 도는지가 git에 적혀 있습니다.** 되돌리는 것은 이전 태그로 되돌리는 커밋 하나입니다
- 파이프라인이 캐시가 채워진 판에서 **1분 54초**입니다 — 다섯 단으로 처음 재편했을 때가 10분 15초였습니다
- 클러스터 밖 어디에도 **클러스터를 조작할 자격이 없습니다**

## 남은 것

**테스트 칸이 비어 있습니다.** 자리는 선언해 뒀지만 도는 job이 없습니다 — 저장소에 돌릴 테스트가 0개입니다. 코드만 읽고 쓰면 통과만 하는 테스트가 되기 쉬워, 앱을 띄우고 동작을 보면서 쓰기로 미뤘습니다. 그래서 지금 이 파이프라인이 보장하는 것은 빌드와 보안 검사까지고, 합쳐진 결과가 실제로 도는지는 아닙니다.

**러너가 데스크탑의 도커 소켓을 물고 있습니다.** 그 소켓으로는 빌드만이 아니라 그 데몬이 할 수 있는 전부를 부를 수 있어, 소켓을 쥔 쪽은 사실상 그 기계의 관리자입니다. 빌드마다 데몬을 새로 띄우는 격리된 방식은 메모리가 더 들고 캐시도 매번 사라져, 지금 조건에서는 이 상태를 받아들였습니다.

## 쓴 것

GitLab CE · GitLab Runner · Docker · Trivy · gitleaks · SpotBugs · ArgoCD · argocd-image-updater
{:.hl-more}

러너는 job마다 컨테이너를 새로 띄워 돌리고, 언어마다 다른 빌드 절차는 각 서비스의 Dockerfile이 품습니다. 배포된 것이 실제로 어떻게 도는지는 관측이 답합니다.
{:.hl-more}
