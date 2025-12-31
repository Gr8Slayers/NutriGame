import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Circle, Defs, ClipPath,G } from 'react-native-svg';
import Animated, { 
  useSharedValue, 
  useAnimatedProps, 
  withRepeat, 
  withTiming, 
  Easing,
  useDerivedValue
} from 'react-native-reanimated';

// Bu path 0-100 koordinat sistemine göre bir dalga çizer
const WAVE_PATH = "M0 0 Q 25 12 50 0 T 100 0 T 150 0 T 200 0 V 150 H 0 Z";
const AnimatedPath = Animated.createAnimatedComponent(Path);
const { width,height } = Dimensions.get('window');

const WaterWave=({progress}:{progress:number})=>{
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(100);

    useEffect(() => {
    translateX.value = withRepeat(
      withTiming(-100, { 
        duration: 2500, 
        easing: Easing.linear 
      }),
      -1, // -1 sonsuz tekrar demektir
      false // false dersen hep aynı yöne akar, true dersen geri döner (yoyo)
    );
  }, []);

    useEffect(() => {
    translateY.value = withTiming(100 - (progress * 100), { 
      duration: 1000 
    });
  }, [progress]);

    const animatedPropsFront = useAnimatedProps(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value }
    ]
  }));

  const animatedPropsBack = useAnimatedProps(() => ({
    transform: [
      { translateX: -translateX.value - 100 }, 
      { translateY: translateY.value + 5 }
    ]
  }));
  return(
        <View style={styles.container}>
      <Svg height="280" width="280" viewBox="0 0 100 100">
        <Defs>
          <ClipPath id="waterClip">
            <Circle cx="50" cy="50" r="48" />
          </ClipPath>
        </Defs>

        <Circle cx="50" cy="50" r="48" fill="#1c2533" />

        <G clipPath="url(#waterClip)">
          <AnimatedPath
            d={WAVE_PATH}
            fill="#1A73E8"
            opacity={0.5}
            animatedProps={animatedPropsBack}
          />
          <AnimatedPath
            d={WAVE_PATH}
            fill="#4285F4"
            animatedProps={animatedPropsFront}
          />
        </G>

        <Circle cx="50" cy="50" r="48" stroke="#333" strokeWidth="1" fill="none" />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop:height*0.13,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default WaterWave;