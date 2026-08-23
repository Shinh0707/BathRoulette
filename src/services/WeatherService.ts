import { type IWeatherService } from "./IWeatherService";
import { type EnvironmentReason } from "../models/EnvironmentReason";

interface AmedasStation {
  lat: [number, number];
  lon: [number, number];
  kjName: string;
}

export class WeatherService implements IWeatherService {
  public readonly serviceName = "WeatherService";

  private readonly latestTimeUrl = "/jma-bosai/bosai/amedas/data/latest_time.txt";
  private readonly mapBaseUrl = "/jma-bosai/bosai/amedas/data/map/";
  private readonly stationTableUrl = "/jma-bosai/bosai/amedas/const/amedastable.json";

  public async fetchAdverseEnvironmentReason(): Promise<EnvironmentReason> {
    try {
      const position = await this.retrieveCoordinates();
      const stationCode = await this.resolveClosestStation(
        position.coords.latitude,
        position.coords.longitude
      );

      const observation = await this.fetchLatestObservation(stationCode);
      return this.constructIntuitiveReport(observation);
    } catch {
      return {
        icon: "☁️",
        summary: "天気の移り変わりがある一日ですね。",
        detail: "空気の揺らぎで、なんとなくぼんやりしやすい頃合いです。",
      };
    }
  }

  private retrieveCoordinates(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("位置情報機能が無効です"));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        timeout: 8000,
      });
    });
  }

  private async resolveClosestStation(lat: number, lon: number): Promise<string> {
    const res = await fetch(this.stationTableUrl);
    if (!res.ok) return "44132"; // 取得失敗時は東京観測所

    const table: Record<string, AmedasStation> = await res.json();
    let closestCode = "44132";
    let minDistance = Infinity;

    for (const [code, station] of Object.entries(table)) {
      const stationLat = station.lat[0] + station.lat[1] / 60;
      const stationLon = station.lon[0] + station.lon[1] / 60;

      const dLat = lat - stationLat;
      const dLon = (lon - stationLon) * Math.cos((lat * Math.PI) / 180);
      const distanceSq = dLat * dLat + dLon * dLon;

      if (distanceSq < minDistance) {
        minDistance = distanceSq;
        closestCode = code;
      }
    }

    return closestCode;
  }

  private async fetchLatestObservation(stationCode: string): Promise<{
    rainfall1h: number;
    temp: number;
    humidity: number;
    sun1h: number;
  }> {
    const timeRes = await fetch(this.latestTimeUrl);
    if (!timeRes.ok) throw new Error("最新時刻の取得に失敗しました");

    const rawText = await timeRes.text();
    const timeKey = rawText.replace(/[^0-9]/g, "").slice(0, 14);

    const mapRes = await fetch(`${this.mapBaseUrl}${timeKey}.json`);
    if (!mapRes.ok) throw new Error("アメダスデータの取得に失敗しました");

    const mapData = await mapRes.json();
    const stationData = mapData[stationCode] || mapData["44132"];

    const rainfall1h = stationData?.precipitation1h ? stationData.precipitation1h[0] : 0;
    const temp = stationData?.temp ? stationData.temp[0] : 20;
    const humidity = stationData?.humidity ? stationData.humidity[0] : 50;
    const sun1h = stationData?.sun1h ? stationData.sun1h[0] : 0;

    return { rainfall1h, temp, humidity, sun1h };
  }

  private constructIntuitiveReport(data: {
    rainfall1h: number;
    temp: number;
    humidity: number;
    sun1h: number;
  }): EnvironmentReason {
    const isRaining = data.rainfall1h > 0;
    const isHot = data.temp >= 28;
    const isCold = data.temp <= 10;
    const isHighHumidity = data.humidity >= 70;
    const isLowSun = data.sun1h === 0;

    if (isRaining && isHighHumidity) {
      return {
        icon: "🌧️",
        summary: "雨と湿り気が重なっている日ですね。",
        detail: "湿度の高さと暗さで、立ち上がるだけでもエネルギーを使いやすい空気です。",
      };
    }

    if (isRaining) {
      return {
        icon: "☔",
        summary: "雨が降っていて、外も少し暗い日ですね。",
        detail: "気分のスイッチが入りにくいのは、天気のせいなのでとても自然なことです。",
      };
    }

    if (isHot) {
      return {
        icon: "🌡️",
        summary: "少し暑くて、体力を取られやすい日ですね。",
        detail: "知らず知らずのうちに疲れていて、お風呂が億劫に感じやすい気温です。",
      };
    }

    if (isCold) {
      return {
        icon: "❄️",
        summary: "冷え込んでいて、身体が縮こまりやすい日ですね。",
        detail: "服を脱ぐだけでも気合いが必要になるくらい、寒さの負荷がかかっています。",
      };
    }

    if (isHighHumidity || isLowSun) {
      return {
        icon: "🌫️",
        summary: "すっきりしない空模様が続いていますね。",
        detail: "お日様が少なめで、身体がお休みモードに入りやすい日です。",
      };
    }

    return {
      icon: "🍃",
      summary: "天気の移り変わりがある一日ですね。",
      detail: "空気のゆらぎに合わせて、身体が自然と省エネモードになっています。",
    };
  }
}