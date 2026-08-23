import { type RouletteStatus } from "./RouletteStatus";

export class RouletteStateContainerModel {
  public status: RouletteStatus = "idle";
  public scanningIndex: number = -1;
  public selectedIndex: number | null = null;
  public canSkip: boolean = false;
  public itemCount: number = 0;
}