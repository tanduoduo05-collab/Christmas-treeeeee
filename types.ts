export interface TreeState {
  isTreeForm: boolean;
  toggleForm: () => void;
}

export enum OrnamentType {
  SPHERE = 'SPHERE',
  BOX = 'BOX'
}

export interface DualPositionAttribute {
  scatter: Float32Array;
  tree: Float32Array;
}
