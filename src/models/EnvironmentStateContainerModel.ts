import { type EnvironmentReason } from './EnvironmentReason'

export class EnvironmentStateContainerModel {
  public reason: EnvironmentReason | null = null;
  public isLoading: boolean = false;
  public isExpanded: boolean = false;
}