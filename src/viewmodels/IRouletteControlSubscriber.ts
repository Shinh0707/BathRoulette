import { type RouletteStatus } from '../models/RouletteStatus'

export interface IRouletteControlSubscriber {
  onStatusChanged(status: RouletteStatus): void;
  onSkipAvailabilityChanged(canSkip: boolean): void;
}