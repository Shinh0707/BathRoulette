import template from "./ReasonExplanationView.html?raw";
import { createTemplate } from "./common";
import { type IViewPart } from "./IViewPart";
import { type EnvironmentReason } from "../models/EnvironmentReason";
import { type IReasonExplanationSubscriber } from "../viewmodels/IReasonExplanationSubscriber";
import { ReasonExplanationViewModel } from "../viewmodels/ReasonExplanationViewModel";

export class ReasonExplanationView implements IViewPart, IReasonExplanationSubscriber {
  private element: HTMLElement | null = null;
  private toggleButton!: HTMLButtonElement;
  private cardContainer!: HTMLElement;
  private loadingMessage!: HTMLElement;
  private resultContainer!: HTMLElement;
  private reasonIcon!: HTMLElement;
  private reasonTitle!: HTMLElement;
  private reasonDetail!: HTMLElement;

  constructor(private readonly viewModel: ReasonExplanationViewModel) {
    this.viewModel.bindEvents(this);
  }

  public async initialize(): Promise<HTMLElement> {
    this.element = createTemplate(template);
    this.toggleButton = this.element.querySelector('[data-ref="toggleButton"]') as HTMLButtonElement;
    this.cardContainer = this.element.querySelector('[data-ref="cardContainer"]') as HTMLElement;
    this.loadingMessage = this.element.querySelector('[data-ref="loadingMessage"]') as HTMLElement;
    this.resultContainer = this.element.querySelector('[data-ref="resultContainer"]') as HTMLElement;
    this.reasonIcon = this.element.querySelector('[data-ref="reasonIcon"]') as HTMLElement;
    this.reasonTitle = this.element.querySelector('[data-ref="reasonTitle"]') as HTMLElement;
    this.reasonDetail = this.element.querySelector('[data-ref="reasonDetail"]') as HTMLElement;

    this.toggleButton.addEventListener("click", () => this.viewModel.toggleReason());

    return this.element;
  }

  public onReasonStateChanged(
    reason: EnvironmentReason | null,
    isLoading: boolean,
    isExpanded: boolean
  ): void {
    this.cardContainer.hidden = !isExpanded;

    if (!isExpanded) {
      return;
    }

    if (isLoading) {
      this.loadingMessage.hidden = false;
      this.resultContainer.hidden = true;
      return;
    }

    this.loadingMessage.hidden = true;

    if (!reason) {
      this.resultContainer.hidden = true;
      return;
    }

    this.reasonIcon.textContent = reason.icon;
    this.reasonTitle.textContent = reason.summary;
    this.reasonDetail.textContent = reason.detail;
    this.resultContainer.hidden = false;
  }
}