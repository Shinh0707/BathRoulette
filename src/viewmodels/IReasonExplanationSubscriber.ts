import { type EnvironmentReason } from '../models/EnvironmentReason'

export interface IReasonExplanationSubscriber {
  onReasonStateChanged(
    reason: EnvironmentReason | null,
    isLoading: boolean,
    isExpanded: boolean
  ): void;
}