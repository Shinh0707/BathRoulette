import { type IRouletteService } from "./IRouletteService";

export class RouletteService implements IRouletteService {
  public readonly serviceName = "RouletteService";

  public generateRandomIndex(maxExclusive: number): number {
    return Math.floor(Math.random() * maxExclusive);
  }

  public buildSpinTimeline(totalSteps: number): number[] {
    const timeline: number[] = [];
    
    // 終盤にゆっくり動かすコマ数を3〜5ステップの間でランダムに決定
    const crawlSteps = Math.floor(Math.random() * 3) + 3;
    // 中間減速に割り当てるステップ数
    const decelerateSteps = Math.min(10, Math.max(4, Math.floor(totalSteps * 0.25)));
    const fastSteps = Math.max(1, totalSteps - decelerateSteps - crawlSteps);

    // 1. 高速巡航区間（約35ms前後）
    for (let i = 0; i < fastSteps; i++) {
      timeline.push(35);
    }

    // 2. 段階的減速区間（50ms〜250msへ滑らかに伸長）
    for (let i = 0; i < decelerateSteps; i++) {
      const progress = (i + 1) / decelerateSteps;
      const delay = 50 + Math.pow(progress, 2) * 200;
      timeline.push(Math.round(delay));
    }

    // 3. 煽り・超低速区間（止まりそうな大きな溜めと不均等な送り）
    for (let i = 0; i < crawlSteps; i++) {
      const isLastStep = i === crawlSteps - 1;
      const isSecondToLast = i === crawlSteps - 2;

      if (isLastStep) {
        // 最終停止直前の重い一歩
        timeline.push(Math.round(550 + Math.random() * 250));
      } else if (isSecondToLast) {
        // 寸止め感を演出する最大の溜め
        timeline.push(Math.round(700 + Math.random() * 300));
      } else {
        // 段階的な低速移行
        const stepProgress = (i + 1) / crawlSteps;
        const delay = 300 + stepProgress * 250 + (Math.random() * 60 - 30);
        timeline.push(Math.round(delay));
      }
    }

    return timeline;
  }
}