import { type IWeatherService } from "./IWeatherService";
import { type EnvironmentReason } from "../models/EnvironmentReason";

const BASE_URL = import.meta.env.VITE_JMA_API_BASE;

interface FeedEntry {
  id: string;
  title: string;
  url: string;
}

export class WeatherService implements IWeatherService {
  public readonly serviceName = "WeatherService";

  private readonly feedUrl = `${BASE_URL}/developer/xml/feed/regular.xml`;
  private domParser = new DOMParser();

  public async fetchAdverseEnvironmentReason(): Promise<EnvironmentReason> {
    try {
      const position = await this.retrieveCoordinates();
      const prefectureName = await this.resolvePrefectureName(
        position.coords.latitude,
        position.coords.longitude
      );

      console.log(`[WeatherService] 検出地域: ${prefectureName}`);
      return await this.fetchJmaWeatherOverview(prefectureName);
    } catch (error) {
      console.error("[WeatherService] 気象情報の取得・解析中にエラーが発生しました:", error);
      return {
        icon: "☁️",
        summary: "天気の移り変わりがある一日ですね。",
        detail: "気温や空気の揺らぎで、少しぼんやりしやすい頃合いです。",
      };
    }
  }

  private retrieveCoordinates(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const err = new Error("端末の位置情報機能が無効または非対応です");
        console.error("[WeatherService] Geolocation error:", err);
        reject(err);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position),
        (error) => {
          console.error("[WeatherService] 位置情報の取得に失敗しました:", error);
          reject(error);
        },
        { timeout: 8000 }
      );
    });
  }

  private async resolvePrefectureName(lat: number, lon: number): Promise<string> {
    try {
      const res = await fetch(
        `https://mreversegeocoder.gsi.go.jp/reverse-geocoder/LonLatToAddress?lat=${lat}&lon=${lon}`
      );
      if (!res.ok) {
        console.warn(`[WeatherService] 逆ジオコーディング応答エラー: HTTP ${res.status}`);
        return "東京都";
      }
      const data = await res.json();
      const muniCd = data?.results?.muniCd;
      if (!muniCd) {
        return "東京都";
      }

      // 都道府県コード先頭2桁から名称を導出
      const prefCode = muniCd.slice(0, 2);
      return this.getPrefectureNameByCode(prefCode);
    } catch (error) {
      console.error("[WeatherService] 逆ジオコーディング通信エラー:", error);
      return "東京都";
    }
  }

  private async fetchJmaWeatherOverview(prefectureName: string): Promise<EnvironmentReason> {
    const feedRes = await fetch(this.feedUrl);
    if (!feedRes.ok) {
      const err = new Error(`気象庁定時フィードの取得に失敗しました: HTTP ${feedRes.status}`);
      console.error("[WeatherService]", err);
      throw err;
    }

    const feedXml = await feedRes.text();
    const entries = this.parseFeed(feedXml);

    // 現在地の都道府県名を含む天気予報または警報電文を検索
    const targetEntry = entries.find(
      (e) =>
        e.title.includes(prefectureName) &&
        (e.title.includes("府県天気予報") || e.title.includes("気象警報・注意報"))
    ) || entries.find((e) => e.title.includes("府県天気予報"));

    if (!targetEntry) {
      console.warn(`[WeatherService] ${prefectureName} に合致する気象電文が見つかりませんでした`);
      return this.constructReportFromText("");
    }

    console.log(`[WeatherService] 取得電文: ${targetEntry.title} (${targetEntry.url})`);

    const docRes = await fetch(targetEntry.url);
    if (!docRes.ok) {
      const err = new Error(`気象電文の取得に失敗しました: HTTP ${docRes.status}`);
      console.error("[WeatherService]", err);
      throw err;
    }

    const docXml = await docRes.text();
    const doc = this.domParser.parseFromString(docXml, "application/xml");

    // 電文XML全体のテキスト情報を収集して判定材料とする
    const textContent = doc.querySelector("Body")?.textContent || "";
    return this.constructReportFromText(textContent);
  }

  private parseFeed(xmlString: string): FeedEntry[] {
    const doc = this.domParser.parseFromString(xmlString, "application/xml");
    const entryElements = doc.querySelectorAll("entry");
    const entries: FeedEntry[] = [];

    entryElements.forEach((entry) => {
      const id = entry.querySelector("id")?.textContent || "";
      const title = entry.querySelector("title")?.textContent || "";
      const link = entry.querySelector("link")?.getAttribute("href") || "";

      if (id && link) {
        const relativeUrl = link.replace(/^https:\/\/www\.data\.jma\.go\.jp/, BASE_URL);
        entries.push({ id, title, url: relativeUrl });
      }
    });

    return entries;
  }

  private constructReportFromText(text: string): EnvironmentReason {
    if (text.includes("大雨") || text.includes("雨") || text.includes("雷")) {
      return {
        icon: "🌧️",
        summary: "雨が降っていて、外も少し暗い日ですね。",
        detail: "湿度の偏りと外の薄暗さで、なんとなく身体に疲れが溜まりやすい日です。",
      };
    }

    if (text.includes("強風") || text.includes("風") || text.includes("低気圧") || text.includes("波浪")) {
      return {
        icon: "📉",
        summary: "気圧が少し下がっている日ですね。",
        detail: "空気が重たく感じられて、動作がゆっくりになりがちです。",
      };
    }

    if (text.includes("雪") || text.includes("低温") || text.includes("着雪")) {
      return {
        icon: "❄️",
        summary: "冷え込みが続いていますね。",
        detail: "空気が冷たく、身体が強張りやすい頃合いです。",
      };
    }

    if (text.includes("高温") || text.includes("晴れ") || text.includes("乾燥")) {
      return {
        icon: "🌡️",
        summary: "少しじめじめとした気候ですね。",
        detail: "すっきりしない空気が続いており、知らず知らず消耗しやすい時節です。",
      };
    }

    return {
      icon: "☁️",
      summary: "天気の移り変わりがある一日ですね。",
      detail: "気温や空気の揺らぎで、少しぼんやりしやすい頃合いです。",
    };
  }

  private getPrefectureNameByCode(code: string): string {
    const prefMap: Record<string, string> = {
      "01": "北海道", "02": "青森県", "03": "岩手県", "04": "宮城県", "05": "秋田県",
      "06": "山形県", "07": "福島県", "08": "茨城県", "09": "栃木県", "10": "群馬県",
      "11": "埼玉県", "12": "千葉県", "13": "東京都", "14": "神奈川県", "15": "新潟県",
      "16": "富山県", "17": "石川県", "18": "福井県", "19": "山梨県", "20": "長野県",
      "21": "岐阜県", "22": "静岡県", "23": "愛知県", "24": "三重県", "25": "滋賀県",
      "26": "京都府", "27": "大阪府", "28": "兵庫県", "29": "奈良県", "30": "和歌山県",
      "31": "鳥取県", "32": "島根県", "33": "岡山県", "34": "広島県", "35": "山口県",
      "36": "徳島県", "37": "香川県", "38": "愛媛県", "39": "高知県", "40": "福岡県",
      "41": "佐賀県", "42": "長崎県", "43": "熊本県", "44": "大分県", "45": "宮崎県",
      "46": "鹿児島県", "47": "沖縄県"
    };
    return prefMap[code] || "東京都";
  }
}