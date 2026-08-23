import { RouletteMediator } from './RouletteMediator'
import { type IReasonExplanationSubscriber } from './IReasonExplanationSubscriber'


export class ReasonExplanationViewModel {
  constructor(private readonly mediator: RouletteMediator) {}

  public toggleReason(): void {
    this.mediator.toggleAndFetchReason();
  }

  public bindEvents(subscriber: IReasonExplanationSubscriber): void {
    this.mediator.subscribeReason(subscriber);
  }
}