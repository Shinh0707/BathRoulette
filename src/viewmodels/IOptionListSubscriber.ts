export interface IOptionListSubscriber {
  onScanningIndexChanged(index: number): void;
  onOptionSelected(index: number): void;
  onRouletteReset(): void;
}