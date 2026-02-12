// Card definitions (16 cards)
const CARD_FILES = [
  "もしランキングモビィ.jpg",
  "応援団長モビィ.jpg",
  "屋上自由時間モビィ.jpg",
  "学級委員モビィ.jpg",
  "教科書落書きモビィ.jpg",
  "自習室モビィ.jpg",
  "図書委員モビィ.jpg",
  "制服アレンジモビィ.jpg",
  "成績掲示板モビィ.jpg",
  "体育祭モビィ.jpg",
  "舞台袖実行委員モビィ.jpg",
  "部室たまり場モビィ.jpg",
  "文化祭センターステージモビィ.jpg",
  "理科室研究モビィ.jpg",
  "裏垢拡散モビィ.jpg",
  "廊下ランウェイモビィ.jpg",
];

export const TYPES = CARD_FILES.map((name, i) => {
  const id = `m${String(i + 1).padStart(2, "0")}`;
  const label = name.replace(/\.jpg$/i, "");
  return {
    id,
    group: "male",
    label,
    img: `./assets/cards/${name}`,
  };
});

export const TYPE_MAP = new Map(TYPES.map((t) => [t.id, t]));
