/**
 * マジックオンボーディング：子供の生年月日・居住エリアから主要イベントを自動生成
 * 七五三・入学・卒業を日本の学制に合わせて算出
 */

export type GeneratedEvent = {
  name: string;
  event_type: string;
  event_date: string; // YYYY-MM-DD
  description?: string;
  event_for?: string;
};

/**
 * 生年月日から七五三・入学・卒業イベントを生成
 * 学制: 6歳の4月に小1、12歳の4月に中1、15歳の4月に高1、18歳の4月に大1
 */
export function generateEventsFromChildBirth(
  birthYear: number,
  birthMonth: number,
  childLabel = 'お子様'
): GeneratedEvent[] {
  const events: GeneratedEvent[] = [];

  // 七五三（3・5・7歳の11月15日）
  for (const age of [3, 5, 7]) {
    const y = birthYear + age;
    events.push({
      name: `${childLabel}の七五三（${age}歳）`,
      event_type: 'celebration',
      event_date: `${y}-11-15`,
      description: `${age}歳の七五三。写真館・神社の予約を検討しましょう。`,
      event_for: childLabel,
    });
  }

  // 4月1日時点で6歳になる年度に小学校入学
  const april1Age6Year = birthMonth <= 3 ? birthYear + 6 : birthYear + 7;
  const grad6Year = april1Age6Year + 6;
  const grad9Year = grad6Year + 3;
  const grad12Year = grad9Year + 3;
  const grad16Year = grad12Year + 4;

  events.push({
    name: `${childLabel}の小学校入学`,
    event_type: 'celebration',
    event_date: `${april1Age6Year}-04-01`,
    description: 'ランドセルや入学準備を始めましょう。',
    event_for: childLabel,
  });
  events.push({
    name: `${childLabel}の小学校卒業`,
    event_type: 'celebration',
    event_date: `${grad6Year}-03-31`,
    description: '卒業式・謝恩会の準備。',
    event_for: childLabel,
  });
  events.push({
    name: `${childLabel}の中学校入学`,
    event_type: 'celebration',
    event_date: `${grad6Year}-04-01`,
    description: '制服・入学準備。',
    event_for: childLabel,
  });
  events.push({
    name: `${childLabel}の中学校卒業`,
    event_type: 'celebration',
    event_date: `${grad9Year}-03-31`,
    description: '卒業式・高校準備。',
    event_for: childLabel,
  });
  events.push({
    name: `${childLabel}の高校入学`,
    event_type: 'celebration',
    event_date: `${grad9Year}-04-01`,
    description: '制服・入学準備。',
    event_for: childLabel,
  });
  events.push({
    name: `${childLabel}の高校卒業`,
    event_type: 'celebration',
    event_date: `${grad12Year}-03-31`,
    description: '卒業式・進路準備。',
    event_for: childLabel,
  });
  events.push({
    name: `${childLabel}の大学入学`,
    event_type: 'celebration',
    event_date: `${grad12Year}-04-01`,
    description: '新生活・入学準備。',
    event_for: childLabel,
  });
  events.push({
    name: `${childLabel}の大学卒業`,
    event_type: 'celebration',
    event_date: `${grad16Year}-03-31`,
    description: '卒業式・就職準備。',
    event_for: childLabel,
  });

  // 今日より前のイベントは除外（または含めるかは product 次第。ここでは最大20年先までに限定）
  const today = new Date();
  const maxYear = today.getFullYear() + 20;
  return events.filter((e) => {
    const y = parseInt(e.event_date.slice(0, 4), 10);
    return y >= today.getFullYear() - 2 && y <= maxYear;
  });
}

export const PREFECTURES = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県', '茨城県', '栃木県', '群馬県',
  '埼玉県', '千葉県', '東京都', '神奈川県', '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県',
  '岐阜県', '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県',
  '鳥取県', '島根県', '岡山県', '広島県', '山口県', '徳島県', '香川県', '愛媛県', '高知県', '福岡県',
  '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県',
] as const;
