import { type IWeatherService } from "./IWeatherService";
import { type EnvironmentReason } from "../models/EnvironmentReason";

export class WeatherService implements IWeatherService {
  public readonly serviceName = "WeatherService";

  public async fetchAdverseEnvironmentReason(): Promise<EnvironmentReason> {
    try {
      const position = await this.retrieveCoordinates();
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;

      const params = new URLSearchParams({
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        current: "surface_pressure,relative_humidity_2m,apparent_temperature,weather_code,cloud_cover",
        timezone: "auto",
      });

      const endpoint = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error("気象データの取得に失敗しました");
      }

      const payload = await response.json();
      const current = payload.current;

      const pressure = current?.surface_pressure ?? 1013.25;
      const humidity = current?.relative_humidity_2m ?? 50;
      const apparentTemp = current?.apparent_temperature ?? 20;
      const cloudCover = current?.cloud_cover ?? 0;
      const weatherCode = current?.weather_code ?? 0;

      return this.constructIntuitiveReport({
        pressure,
        humidity,
        apparentTemp,
        cloudCover,
        weatherCode,
      });
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

  private constructIntuitiveReport(data: {
    pressure: number;
    humidity: number;
    apparentTemp: number;
    cloudCover: number;
    weatherCode: number;
  }): EnvironmentReason {
    const isLowPressure = data.pressure < 1012;
    const isHighHumidity = data.humidity >= 65;
    const isRain = (data.weatherCode >= 51 && data.weatherCode <= 67) || (data.weatherCode >= 80 && data.weatherCode <= 82);
    const isOvercast = data.cloudCover >= 80;
    const isHot = data.apparentTemp >= 28;
    const isCold = data.apparentTemp <= 10;

    // 気圧が低く湿気もある日
    if (isLowPressure && isHighHumidity) {
      return {
        icon: "🌀",
        summary: "どんよりして、身体が重くなりやすい日ですね。",
        detail: "湿気も多くて、立ち上がるだけでもエネルギーを使いやすい空気です。",
      };
    }

    // 雨の日
    if (isRain) {
      return {
        icon: "🌧️",
        summary: "雨が降っていて、外も少し暗い日ですね。",
        detail: "気分のスイッチが入りにくいのは、天気のせいなのでとても自然なことです。",
      };
    }

    // 気圧低下
    if (isLowPressure) {
      return {
        icon: "📉",
        summary: "気圧が少し下がっている日ですね。",
        detail: "空気が重たく感じられて、動作がゆっくりになりがちな頃合いです。",
      };
    }

    // 暑さ・熱気
    if (isHot) {
      return {
        icon: "🌡️",
        summary: "少し暑くて、体力を取られやすい日ですね。",
        detail: "知らず知らずのうちに疲れていて、お風呂が億劫に感じやすい気温です。",
      };
    }

    // 寒さ・冷え
    if (isCold) {
      return {
        icon: "❄️",
        summary: "冷え込んでいて、身体が縮こまりやすい日ですね。",
        detail: "服を脱ぐだけでも気合いが必要になるくらい、寒さの負荷がかかっています。",
      };
    }

    // 曇り・湿度高め
    if (isHighHumidity || isOvercast) {
      return {
        icon: "🌫️",
        summary: "すっきりしない空模様が続いていますね。",
        detail: "お日様が少なめで、身体がお休みモードに入りやすい日です。",
      };
    }

    // デフォルト
    return {
      icon: "🍃",
      summary: "天気の移り変わりがある一日ですね。",
      detail: "空気のゆらぎに合わせて、身体が自然と省エネモードになっています。",
    };
  }
}