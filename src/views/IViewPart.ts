export interface IViewPart {
  initialize(): Promise<HTMLElement>;
}