import { type IService } from "./IService";

export interface IRouletteService extends IService {
  generateRandomIndex(maxExclusive: number): number;
  buildSpinTimeline(totalSteps: number): number[];
}