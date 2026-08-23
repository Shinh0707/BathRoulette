import template from "./RouletteControlView.html?raw";
import { createTemplate } from "./common";
import { type IViewPart } from "./IViewPart";
import { type RouletteStatus } from "../models/RouletteStatus";
import { type IRouletteControlSubscriber } from "../viewmodels/IRouletteControlSubscriber";
import { RouletteControlViewModel } from "../viewmodels/RouletteControlViewModel";

export class RouletteControlView implements IViewPart, IRouletteControlSubscriber {
  private element: HTMLElement | null = null;
  private startButton!: HTMLButtonElement;
  private skipButton!: HTMLButtonElement;

  private spinDuration: number = 0;
  private skipRemaining: number = 0;

  constructor(private readonly viewModel: RouletteControlViewModel) {
    this.viewModel.bindEvents(this);
  }

  public async initialize(): Promise<HTMLElement> {
    this.element = createTemplate(template);
    this.startButton = this.element.querySelector('[data-ref="startButton"]') as HTMLButtonElement;
    this.skipButton = this.element.querySelector('[data-ref="skipButton"]') as HTMLButtonElement;

    this.spinDuration = Number(this.element.dataset.spinDuration);
    this.skipRemaining = Number(this.element.dataset.skipRemaining);

    this.startButton.addEventListener("click", () => {
      this.viewModel.requestSpin(this.spinDuration, this.skipRemaining);
    });
    this.skipButton.addEventListener("click", () => {
      this.viewModel.requestSkip();
    });

    return this.element;
  }

  public onStatusChanged(status: RouletteStatus): void {
    if (status === "spinning") {
      this.startButton.disabled = true;
      this.startButton.textContent = "抽選中";
    } else if (status === "completed") {
      this.startButton.disabled = false;
      this.startButton.textContent = "もう一度引き直す";
      this.skipButton.disabled = true;
    } else {
      this.startButton.disabled = false;
      this.startButton.textContent = "ルーレットを開始する";
      this.skipButton.disabled = true;
    }
  }

  public onSkipAvailabilityChanged(canSkip: boolean): void {
    this.skipButton.disabled = !canSkip;
  }
}