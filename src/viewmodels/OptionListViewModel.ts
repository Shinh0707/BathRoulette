import { type IOptionListSubscriber } from "./IOptionListSubscriber";
import { RouletteMediator } from "./RouletteMediator";

export class OptionListViewModel {
  constructor(private readonly mediator: RouletteMediator) {}

  public registerItemCount(count: number): void {
    this.mediator.setItemCount(count);
  }

  public bindEvents(subscriber: IOptionListSubscriber): void {
    this.mediator.subscribeOptionList(subscriber);
  }
}