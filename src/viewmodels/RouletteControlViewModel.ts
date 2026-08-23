import { RouletteMediator } from "./RouletteMediator";
import { type IRouletteControlSubscriber } from "./IRouletteControlSubscriber";

export class RouletteControlViewModel {
  constructor(private readonly mediator: RouletteMediator) {}

  public requestSpin(spinDuration?: number, skipRemaining?: number): void {
    this.mediator.beginSpin(spinDuration, skipRemaining);
  }

  public requestSkip(): void {
    this.mediator.skipToEnding();
  }

  public bindEvents(subscriber: IRouletteControlSubscriber): void {
    this.mediator.subscribeControl(subscriber);
  }
}