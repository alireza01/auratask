import * as THREE from 'three';
import { ShaderMaterialProps } from '@react-three/fiber';

declare module '@react-three/fiber' {
  interface ThreeElements {
    bubbleMaterial: ShaderMaterialProps & {
      uTime?: number;
      uPopProgress?: number;
      uPopInstability?: number;
      uJiggle?: number;
      uColor?: THREE.ColorRepresentation;
      // Props from THREE.ShaderMaterial that might be used directly
      transparent?: boolean;
      side?: THREE.Side;
    }
  }
}
