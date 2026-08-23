import template from "./OptionListView.html?raw";
import { createTemplate } from "./common";
import { type IViewPart } from "./IViewPart";
import { OptionListViewModel } from "../viewmodels/OptionListViewModel";
import { type IOptionListSubscriber } from "../viewmodels/IOptionListSubscriber";

export class OptionListView implements IViewPart, IOptionListSubscriber {
  private element: HTMLElement | null = null;
  private slotElements: HTMLElement[] = [];

  constructor(private readonly viewModel: OptionListViewModel) {
    this.viewModel.bindEvents(this);
  }

  public async initialize(): Promise<HTMLElement> {
    this.element = createTemplate(template);
    this.slotElements = Array.from(
      this.element.querySelectorAll<HTMLElement>(".reel-slot")
    );
    this.viewModel.registerItemCount(this.slotElements.length);

    return this.element;
  }

  public onScanningIndexChanged(activeIndex: number): void {
    this.slotElements.forEach((el, index) => {
      el.classList.remove("is-selected");
      if (index === activeIndex) {
        el.classList.add("is-scanning");
      } else {
        el.classList.remove("is-scanning");
      }
    });
  }

  public onOptionSelected(selectedIndex: number): void {
    this.slotElements.forEach((el, index) => {
      el.classList.remove("is-scanning");
      if (index === selectedIndex) {
        el.classList.add("is-selected");
      } else {
        el.classList.remove("is-selected");
      }
    });
  }

  public onRouletteReset(): void {
    this.slotElements.forEach((el) => {
      el.classList.remove("is-scanning", "is-selected");
    });
  }
}