// Mock tree data for testing the tree visualization
// Based on the JSON structure provided in the task
export const mockTreeData = {
  "status": "success",
  "data": {
    "assignment": {
      "id": 1,
      "title": null,
      "subject": "사회",
      "chapter": "인구 변화와 사회 문제",
      "createdAt": "2025-06-04T03:53:06.178112"
    },
    "student": {
      "id": 1,
      "name": "배영경",
      "number": "0001"
    },
    "treeStructure": {
      "id": 0,
      "content": "고령화 사회의 원인 탐구",
      "summary": null,
      "type": "SUBJECT",
      "createdBy": "TEACHER",
      "createdAt": "2025-06-04T03:53:06.178112",
      "updatedAt": "2025-06-04T03:53:06.178112",
      "evidences": [],
      "children": [
        {
          "id": 1,
          "content": "고령화의 원인은 평균 수명 증가와 저출산임.",
          "summary": "고령화는 평균 수명 증가와 저출산 때문에 발생한다.",
          "type": "CLAIM",
          "createdBy": "STUDENT",
          "createdAt": "2025-06-05T05:48:59.55406",
          "updatedAt": "2025-06-05T05:48:59.55406",
          "evidences": [
            {
              "id": 1,
              "content": "평균 수명 증가\n생활 수준 향상, 의료 기술 발달, 영양 및 위생 상태 개선으로 인해 사람들의 평균 수명이 길어짐\n한국은 OECD 국가 중 기대수명 증가 속도가 매우 빠름\n2003년 평균 수명 77.46세 → 2024년 남성 86세 이상, 여성 90세 이상, 평균 88세 이상 전망",
              "summary": "한국은 생활 수준과 의료 기술 발달로 2003년 77.46세에서 2024년 평균 88세 이상으로 평균 수명이 크게 증가하였다.",
              "source": "출처",
              "url": "https://example.com/source",
              "createdBy": "STUDENT",
              "createdAt": "2025-06-05T05:48:59.833268"
            },
            {
              "id": 2,
              "content": "출산율 감소로 인구가 줄어 고령화 가속화\n저출산 원인:\n자녀 양육 경제적 부담 증가\n여성 사회 참여 증가\n결혼 연령 상승 및 미혼 인구 증가\n결혼과 가족에 대한 가치관 변화\n2023년 한국 합계출산율 0.72명 (세계 최저 수준), 대체 출산율 2.1명에 크게 못 미침",
              "summary": "한국은 출산율 감소와 결혼 및 가족 가치관 변화 등으로 인구 감소와 고령화가 가속화되고 있다.",
              "source": "출처",
              "url": "https://example.com/source",
              "createdBy": "STUDENT",
              "createdAt": "2025-06-05T05:48:59.894144"
            }
          ],
          "children": [
            {
              "id": 4,
              "content": "평균 수명이 증가했다고 해서 고령화의 모든 문제가 해결되는 것은 아니다. 평균 수명이 늘어난 것과 함께 노년층의 건강 상태, 경제적 자립 능력, 사회적 지원 체계 등이 충분히 개선되지 않으면 고령화로 인한 사회적 부담은 여전히 클 수 있다.",
              "summary": "평균 수명 증가만으로는 고령화 문제 해결이 어려우며 건강, 경제, 사회 지원 개선이 필요하다.",
              "type": "COUNTER",
              "createdBy": "AI",
              "createdAt": "2025-06-07T14:33:52.567357",
              "updatedAt": "2025-06-07T14:33:52.567357",
              "evidences": [
                {
                  "id": 7,
                  "content": "평균 수명은 증가했지만, 건강수명(질병 없이 건강하게 생활할 수 있는 기간)은 평균 수명에 비해 덜 증가하는 경향이 있다. 이는 노년층의 의료비 및 복지 부담 증가로 이어진다.",
                  "summary": "평균 수명은 늘었지만 건강수명은 덜 증가해 노년층의 의료비와 복지 부담이 증가한다.",
                  "source": null,
                  "url": null,
                  "createdBy": "AI",
                  "createdAt": "2025-06-07T14:33:52.685638"
                }
              ],
              "children": [],
              "triggeredByEvidenceId": 1,
              "hidden": false
            }
          ],
          "triggeredByEvidenceId": null,
          "hidden": false
        }
      ],
      "triggeredByEvidenceId": null,
      "hidden": false
    },
    "statistics": {
      "totalNodes": 7,
      "studentNodes": 4,
      "aiNodes": 3,
      "aiInteractions": 3,
      "totalEvidences": 12,
      "studentEvidences": 9,
      "aiEvidences": 3,
      "startedAt": "2025-06-05T05:48:59.55406",
      "lastActivityAt": "2025-06-08T06:58:40.251013",
      "totalDuration": "3일 1시간 9분"
    }
  }
};

export default mockTreeData;