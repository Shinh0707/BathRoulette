import { RouletteStateContainerModel } from "./models/RouletteStateContainerModel";
import { EnvironmentStateContainerModel } from "./models/EnvironmentStateContainerModel";

import { type IRouletteService } from "./services/IRouletteService";
import { RouletteService } from "./services/RouletteService";

import { type IWeatherService } from "./services/IWeatherService";
import { WeatherService } from "./services/WeatherService";

import { RouletteMediator } from "./viewmodels/RouletteMediator";
import { OptionListViewModel } from "./viewmodels/OptionListViewModel";
import { RouletteControlViewModel } from "./viewmodels/RouletteControlViewModel";
import { ReasonExplanationViewModel } from "./viewmodels/ReasonExplanationViewModel";

import { OptionListView } from "./views/OptionListView";
import { RouletteControlView } from "./views/RouletteControlView";
import { ReasonExplanationView } from "./views/ReasonExplanationView";

const initApp = async () => {
  const mountPoint = document.getElementById("app-root");
  if (!mountPoint) {
    return;
  }

  const rouletteStateContainer = new RouletteStateContainerModel();
  const environmentStateContainer = new EnvironmentStateContainerModel();

  const rouletteService: IRouletteService = new RouletteService();
  const weatherService: IWeatherService = new WeatherService();

  const mediator = new RouletteMediator(
    rouletteStateContainer,
    environmentStateContainer,
    rouletteService,
    weatherService
  );

  const optionListVm = new OptionListViewModel(mediator);
  const controlVm = new RouletteControlViewModel(mediator);
  const reasonVm = new ReasonExplanationViewModel(mediator);

  const optionListView = new OptionListView(optionListVm);
  const controlView = new RouletteControlView(controlVm);
  const reasonView = new ReasonExplanationView(reasonVm);

  const [optionListEl, controlEl, reasonEl] = await Promise.all([
    optionListView.initialize(),
    controlView.initialize(),
    reasonView.initialize(),
  ]);

  mountPoint.appendChild(optionListEl);
  mountPoint.appendChild(controlEl);
  mountPoint.appendChild(reasonEl);
};

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}