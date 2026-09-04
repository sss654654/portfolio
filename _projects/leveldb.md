---
layout: page
title: LevelDB 캐시 메커니즘 분석
date: 2022-12-01
description: >
  C++ 소스를 읽고 캐시 파라미터가 읽기 성능에 미치는 영향을 실측했습니다 — KSC 2022 학부생 논문 1저자
links:
  - title: leveldb-cache-analysis
    url: https://github.com/sss654654/leveldb-cache-analysis
---

<p class="hl-back" markdown="0"><a href="/projects/">← 프로젝트</a></p>

단국대학교 시스템 소프트웨어 연구실의 학부 연구(2022.07–12)에서 Google LevelDB의 캐시를 맡았습니다.
LSM-tree는 변경을 순차 기록해 쓰기에 유리하지만, 찾는 key가 어느 SSTable에 있는지 몰라 읽기가 약합니다.
LevelDB는 인덱스 캐시와 블록 캐시로 그것을 보완하는데,
**두 캐시가 다른 것을 담으면서 LRU 엔진 하나를 공유하는 구조였습니다.**
소스로 그 구조를 규명하고 db_bench로 파라미터를 실측해 KSC 2022 학부생 논문으로 게재했습니다.

## 읽기 경로

<figure class="hl-diagram" markdown="0">
<img src="/assets/img/projects/leveldb-readpath.png" alt="SSTable 읽기 경로 — TableCache::Get(key)가 인덱스 캐시(key=file_number, value=인덱스 블록)를 거쳐 Bloom 필터, 블록 캐시(key=cache_id+offset, value=데이터 블록)를 순서대로 조회. 히트면 메모리에서 반환, 미스면 디스크의 SSTable 파일을 읽어 채움">
<figcaption>두 캐시 모두 히트면 메모리에서 끝나고, 미스면 SSTable에서 읽어와 채웁니다.</figcaption>
</figure>

다른 것은 value의 쓰임입니다. 인덱스 캐시는 value로 **어느 데이터 블록인지 위치를 찾고**,
블록 캐시는 value에서 **값을 바로 꺼냅니다.**
블록 캐시 키에 `cache_id`가 붙는 것은 여러 SSTable이 같은 offset을 써도 충돌하지 않게 하려는 것입니다.

## LRU 엔진

<figure class="hl-diagram" markdown="0">
<img src="/assets/img/projects/leveldb-lru.png" alt="ShardedLRUCache — key의 상위 해시 비트로 16개 샤드 중 하나를 고르고, 샤드 하나 안에서 같은 LRUHandle이 해시테이블(버킷 체인)과 이중 연결 리스트에 동시에 걸린다. 리스트는 lru_(refs=1, evict 후보)와 in_use_(refs≥2, evict 보호) 둘로 나뉜다">
<figcaption>키도 저장물도 다른 두 캐시가 같은 <code>ShardedLRUCache</code>를 씁니다. 용량 기준만 다릅니다.</figcaption>
</figure>

- **16개 샤드에 독립 락** — 캐시 전체에 락이 하나면 모든 조회가 줄을 섭니다. 샤드를 쪼개 두면 서로 다른 키는 동시에 조회됩니다
- **한 노드로 조회와 순서를 함께** — 빠른 조회와 LRU 순서 관리는 보통 다른 자료구조를 요구하는데, 같은 `LRUHandle`을 해시테이블과 이중 연결 리스트에 동시에 걸어 둘을 한 번에 만족시킵니다
- **`refs`로 use-after-free 차단** — eviction은 `lru_`(refs=1)만 훑고 `in_use_`(refs≥2)는 건드리지 않습니다. 쓰던 블록은 다 쓰고 `lru_`로 내려온 뒤에야 후보가 됩니다
- **용량 세는 기준이 다름** — 같은 엔진인데 인덱스 캐시는 개수(파일 수)로, 블록 캐시는 바이트로 셉니다

## 실측

인덱스 캐시는 개수만, 블록 캐시는 크기만 독립 변수로 두고 세 워크로드의 latency를 쟀습니다.
워크로드가 다르게 반응하는 이유는 **워킹셋 크기** 차이입니다 —
readrandom(전체 key 무작위) · seekrandom(모든 레벨을 훑음 · 가장 큼) · readhot(전체의 1%만 반복 · 가장 작음).
환경은 EC2 t2.micro, key 16B · value 100B, fillrandom 100MB 로드.

| 변수 | readrandom | seekrandom | readhot |
|---|---|---|---|
| 인덱스 캐시 개수 0 → 10,000 | **190 → 75μs** | 275 → 110μs | — |
| 블록 캐시 크기 1KB → 1GB | **190 → 27μs** | 195 → 33μs | 115 → 65μs |
{:.hl-dec}

<div class="hl-pair" markdown="0">
<figure class="hl-diagram">
<img src="/assets/img/projects/leveldb-index-cache.png" alt="실험 1 — 인덱스 캐시 개수 0·1·10·100·1,000·10,000에 따른 readrandom·seekrandom latency. 100개에서 바닥">
<figcaption>실험 1 — 인덱스 캐시 개수</figcaption>
</figure>
<figure class="hl-diagram">
<img src="/assets/img/projects/leveldb-block-cache.png" alt="실험 2 — 블록 캐시 크기 1KB부터 1GB까지에 따른 readrandom·seekrandom·readhot latency. readrandom은 꾸준히, seekrandom은 100MB 이후 급락, readhot은 평탄">
<figcaption>실험 2 — 블록 캐시 크기</figcaption>
</figure>
</div>

인덱스 캐시는 **100개에서 포화합니다** — 이 실험의 SSTable이 100개 이하라 더 캐싱할 인덱스 블록이 없습니다.
블록 캐시는 **워킹셋에 비례합니다** — seekrandom은 100MB를 넘어야 급락하고, readhot은 1KB에서 이미 낮아 개선 폭이 작습니다.
같은 "캐시를 키운다"라도 워크로드의 워킹셋이 곡선을 정합니다.

## 남은 것

- **t2.micro 단일 인스턴스 실험입니다** — 멀티노드·대용량 환경의 캐시 거동은 검증하지 못했습니다
- **16개 샤드가 어떤 기준으로 나뉘고 어떻게 로드밸런싱되는지는 제기만 했습니다** — 논문 결론의 후속 과제로 남겼습니다

## 쓴 것

C++ · LevelDB · LSM-tree · SSTable · LRU Cache · db_bench · AWS EC2
{:.hl-more}

[github.com/sss654654/leveldb-cache-analysis](https://github.com/sss654654/leveldb-cache-analysis) · [논문 PDF](https://github.com/sss654654/leveldb-cache-analysis/blob/main/papers/%EC%B5%9C%EC%A2%85%EB%B3%B8LevelDB_%EC%BA%90%EC%8B%9C_%EA%B5%AC%EC%A1%B0_%EB%B0%8F_%EC%84%B1%EB%8A%A5_%EB%B6%84%EC%84%9D.pdf)
{:.hl-more}

{% include pj-nav.html %}
