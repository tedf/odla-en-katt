/**
 * Re-export aggregator for progression helpers.
 * (Compat with task instructions.)
 */

export * from './economy';
export {
  PLOT_UNLOCK_THRESHOLDS,
  plotUnlockThreshold,
  shouldPlotBeUnlocked,
  MAX_PLOTS,
} from './plots';
