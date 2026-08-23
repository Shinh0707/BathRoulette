import { RouletteStateContainerModel } from "../models/RouletteStateContainerModel";
import { EnvironmentStateContainerModel } from "../models/EnvironmentStateContainerModel";
import { type IRouletteService } from "../services/IRouletteService";
import { type IWeatherService } from "../services/IWeatherService";
import { type IOptionListSubscriber } from "./IOptionListSubscriber";
import { type IRouletteControlSubscriber } from "./IRouletteControlSubscriber";
import { type IReasonExplanationSubscriber } from "./IReasonExplanationSubscriber";

export class RouletteMediator {
  private optionListSubscribers: IOptionListSubscriber[] = [];
  private controlSubscribers: IRouletteControlSubscriber[] = [];
  private reasonSubscribers: IReasonExplanationSubscriber[] = [];

  private stepTimerId: number | null = null;
  private skipTimerId: number | null = null;

  private currentStepIndex: number = 0;
  private targetOptionIndex: number = 0;
  private remainingDelays: number[] = [];

  constructor(
    public readonly rouletteState: RouletteStateContainerModel,
    public readonly environmentState: EnvironmentStateContainerModel,
    private readonly rouletteService: IRouletteService,
    private readonly weatherService: IWeatherService
  ) {}

  public setItemCount(count: number): void {
    this.rouletteState.itemCount = count;
  }

  public subscribeOptionList(subscriber: IOptionListSubscriber): void {
    this.optionListSubscribers.push(subscriber);
  }

  public subscribeControl(subscriber: IRouletteControlSubscriber): void {
    this.controlSubscribers.push(subscriber);
  }

  public subscribeReason(subscriber: IReasonExplanationSubscriber): void {
    this.reasonSubscribers.push(subscriber);
  }

  public beginSpin(_spinDuration: number = 3600, _skipRemaining: number = 1500): void {
    if (this.rouletteState.status === "spinning" || this.rouletteState.itemCount <= 0) {
      return;
    }

    this.abortTimers();
    const optionsCount = this.rouletteState.itemCount;

    this.targetOptionIndex = this.rouletteService.generateRandomIndex(optionsCount);
    this.rouletteState.status = "spinning";
    this.rouletteState.canSkip = false;
    this.rouletteState.selectedIndex = null;

    this.optionListSubscribers.forEach((sub) => sub.onRouletteReset());
    this.notifyControlState();

    this.skipTimerId = window.setTimeout(() => {
      this.rouletteState.canSkip = true;
      this.notifyControlState();
    }, 800);

    const baseRounds = Math.floor(Math.random() * 3) + 4;
    const currentOffset = this.currentStepIndex % optionsCount;
    const distanceToTarget = (this.targetOptionIndex - currentOffset + optionsCount) % optionsCount;
    const totalSteps = optionsCount * baseRounds + distanceToTarget;

    this.remainingDelays = this.rouletteService.buildSpinTimeline(totalSteps);
    this.executeNextStep();
  }

  public skipToEnding(): void {
    if (this.rouletteState.status !== "spinning" || !this.rouletteState.canSkip) {
      return;
    }

    this.abortTimers();
    const optionsCount = this.rouletteState.itemCount;

    // 即座に最終地点手前の1コマへ移動させ、最後の確定ステップのみを実行
    this.currentStepIndex = (this.targetOptionIndex - 1 + optionsCount) % optionsCount;
    this.remainingDelays = [200];

    this.rouletteState.canSkip = false;
    this.notifyControlState();
    this.executeNextStep();
  }

  public async toggleAndFetchReason(): Promise<void> {
    this.environmentState.isExpanded = !this.environmentState.isExpanded;

    if (this.environmentState.isExpanded && !this.environmentState.reason) {
      this.environmentState.isLoading = true;
      this.notifyReasonState();

      this.environmentState.reason = await this.weatherService.fetchAdverseEnvironmentReason();
      this.environmentState.isLoading = false;
    }

    this.notifyReasonState();
  }

  private executeNextStep(): void {
    if (this.remainingDelays.length === 0) {
      this.concludeSpin(this.targetOptionIndex);
      return;
    }

    const nextDelay = this.remainingDelays.shift()!;
    const optionsCount = this.rouletteState.itemCount;
    this.currentStepIndex = (this.currentStepIndex + 1) % optionsCount;

    this.optionListSubscribers.forEach((sub) =>
      sub.onScanningIndexChanged(this.currentStepIndex)
    );

    this.stepTimerId = window.setTimeout(() => this.executeNextStep(), nextDelay);
  }

  private concludeSpin(finalIndex: number): void {
    this.abortTimers();
    this.rouletteState.selectedIndex = finalIndex;
    this.rouletteState.canSkip = false;
    this.rouletteState.status = "completed";

    this.optionListSubscribers.forEach((sub) =>
      sub.onOptionSelected(finalIndex)
    );
    this.notifyControlState();
  }

  private abortTimers(): void {
    if (this.stepTimerId !== null) {
      clearTimeout(this.stepTimerId);
      this.stepTimerId = null;
    }
    if (this.skipTimerId !== null) {
      clearTimeout(this.skipTimerId);
      this.skipTimerId = null;
    }
  }

  private notifyControlState(): void {
    this.controlSubscribers.forEach((sub) => {
      sub.onStatusChanged(this.rouletteState.status);
      sub.onSkipAvailabilityChanged(this.rouletteState.canSkip);
    });
  }

  private notifyReasonState(): void {
    this.reasonSubscribers.forEach((sub) =>
      sub.onReasonStateChanged(
        this.environmentState.reason,
        this.environmentState.isLoading,
        this.environmentState.isExpanded
      )
    );
  }
}