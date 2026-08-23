import { type IService } from './IService'
import { type EnvironmentReason } from '../models/EnvironmentReason'

export interface IWeatherService extends IService {
  fetchAdverseEnvironmentReason(): Promise<EnvironmentReason>;
}