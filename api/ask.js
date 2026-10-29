// Vercel 서버리스 함수: 브라우저 → /api/ask → OpenAI(GPT)
// API 키는 코드에 쓰지 말고 Vercel 환경변수 OPENAI_API_KEY 에 넣으세요.
// 모델은 환경변수 OPENAI_MODEL 로 바꿀 수 있어요. (계정에서 쓸 수 있는 모델 이름 확인)

const SYSTEM = `너는 'Re:Cloth'라는 의류 수거 안내 서비스의 도우미야.
- 폐의류, 의류수거함 배출 방법을 쉬운 한국어로 3~5문장 이내로 안내해.
- 기본 원칙: 깨끗하고 마른 의류를 비닐봉투에 담아 묶어서 넣기, 신발은 짝 묶기.
- 수거 불가 예: 솜이불, 베개, 방석·쿠션, 롤러스케이트, 카펫·매트, 젖거나 곰팡이 핀 옷, 훼손이 심한 옷.
- 수거 가능 예: 헌옷, 신발, 가방, 모자·벨트, 담요, 누비이불(상태가 깨끗할 때).
- 지역과 수거업체마다 기준이 다르니 수거함 안내문과 관할 구청 안내를 확인하라고 알려줘.
- 실제 수거업체 이름·전화번호·주소는 지어내지 말고, 모르면 모른다고 말해.
- 의류 처리와 관련 없는 질문에는 정중히 범위를 안내해.`;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const question = String((req.body && req.body.question) || "").trim();
  if (!question || question.length > 300) {
    return res.status(400).json({ error: "질문은 1~300자로 입력해 주세요." });
  }
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: "서버에 OPENAI_API_KEY가 설정되지 않았어요." });
  }

  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        max_tokens: 400,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: question },
        ],
      }),
    });
    const j = await r.json();
    if (!r.ok) {
      console.error("OpenAI error:", j);
      return res.status(502).json({ error: "AI 호출에 실패했어요." });
    }
    res.json({ answer: j.choices?.[0]?.message?.content?.trim() || "답변을 만들지 못했어요." });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "서버 오류가 발생했어요." });
  }
}
