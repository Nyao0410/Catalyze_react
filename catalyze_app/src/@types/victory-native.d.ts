declare module 'victory-native' {
  // Minimal declarations to satisfy TypeScript until real types are installed.
  import * as React from 'react';
  import { StyleProp, ViewStyle } from 'react-native';

  type DataPoint = { x: any; y: number };

  export const VictoryChart: React.ComponentType<any>;
  export const VictoryAxis: React.ComponentType<any>;
  export const VictoryStack: React.ComponentType<any>;
  export const VictoryBar: React.ComponentType<any>;
  export const VictoryLegend: React.ComponentType<any>;

  export default {} as any;
}
