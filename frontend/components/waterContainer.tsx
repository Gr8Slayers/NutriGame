import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import { Canvas, Path, Skia, Group, Circle, LinearGradient, vec, Rect } from "@shopify/react-native-skia";
import Animated, {
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  useDerivedValue
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
const SIZE = 300;
const R = SIZE / 2;

interface WaterWaveProps {
  progress: number;
  maxCapacity?: number;
}

const createWavePath = (progress: number, clockValue: number, size: number, phaseOffset: number, amplitude: number, frequency: number) => {
  'worklet';
  const skPath = Skia.Path.Make();
  const currentProgress = Math.min(Math.max(progress, 0), 1);
  const level = size - (currentProgress * size);

  skPath.moveTo(0, level);

  for (let x = 0; x <= size; x += 5) {
    const y = level + Math.sin((x / frequency) * Math.PI * 2 + (clockValue * Math.PI * 2) + phaseOffset) * amplitude;
    skPath.lineTo(x, y);
  }

  skPath.lineTo(size, size);
  skPath.lineTo(0, size);
  skPath.close();
  return skPath;
};

const WaterWave = ({ progress, maxCapacity = 3000 }: WaterWaveProps) => {
  const clock = useSharedValue(0);

  useEffect(() => {
    clock.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const path1 = useDerivedValue(() => createWavePath(progress, clock.value, SIZE, 0, 10, 180), [progress, clock]);
  const path2 = useDerivedValue(() => createWavePath(progress, clock.value, SIZE, Math.PI, 8, 200), [progress, clock]);
  const path3 = useDerivedValue(() => createWavePath(progress, clock.value, SIZE, Math.PI / 2, 6, 220), [progress, clock]);

  // Generate ticks for the meter
  const ticks = [];
  const tickCount = 6; // Every 500ml if max is 3000
  for (let i = 1; i < tickCount; i++) {
    const ratio = i / tickCount;
    const y = SIZE - (ratio * SIZE);
    // Only draw ticks if they are within the circle roughly
    // We'll draw them on the right side
    ticks.push({ y, value: Math.round(maxCapacity * ratio) });
  }

  return (
    <View style={styles.container}>
      <View style={styles.circleContainer}>
        <Canvas style={{ width: SIZE, height: SIZE }}>
          {/* Clip everything to the circle */}
          <Group clip={Skia.Path.Make().addCircle(R, R, R)}>

            {/* Background - Darker deep water look */}
            <Circle cx={R} cy={R} r={R} color="#1a1a1a" />

            {/* Back Wave - Darker */}
            <Path path={path1} color="#1e3a8a" opacity={0.5} />

            {/* Middle Wave - Medium Blue */}
            <Path path={path2} color="#2563eb" opacity={0.6} />

            {/* Front Wave - Bright Blue with Gradient */}
            <Path path={path3}>
              <LinearGradient
                start={vec(0, 0)}
                end={vec(0, SIZE)}
                colors={["#60a5fa", "#3b82f6"]}
              />
            </Path>

            {/* Glass Reflection / Glare */}
            <Circle cx={R} cy={R} r={R} style="stroke" strokeWidth={2} color="rgba(255,255,255,0.1)" />
            <Path
              path={Skia.Path.Make().addOval({ x: R - 80, y: 40, width: 160, height: 60 })}
              color="rgba(255,255,255,0.1)"
            />

            {/* Meter Ticks */}
            {ticks.map((tick, index) => (
              <Group key={index}>
                <Rect x={SIZE - 30} y={tick.y} width={15} height={2} color="rgba(255,255,255,0.5)" />
              </Group>
            ))}

          </Group>

          {/* Border Ring */}
          <Circle cx={R} cy={R} r={R} style="stroke" strokeWidth={4} color="#333" />
        </Canvas>

        {/* Overlay Text for Volume */}
        <View style={styles.textOverlay}>
          <Text style={styles.volumeText}>
            {Math.round(progress * maxCapacity)} ml
          </Text>
          <Text style={styles.percentageText}>
            {Math.round(progress * 100)}%
          </Text>
        </View>

        {/* Ticks Labels (Absolute positioned RN Text) */}
        {ticks.map((tick, index) => (
          <Text key={index} style={[styles.tickLabel, { top: tick.y - 8, left: SIZE - 25 }]}>
            -
          </Text>
        ))}

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  circleContainer: {
    width: SIZE,
    height: SIZE,
    position: 'relative',
  },
  textOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  volumeText: {
    fontSize: 42,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  percentageText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 5,
  },
  tickLabel: {
    position: 'absolute',
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    fontWeight: 'bold',
  }
});

export default WaterWave;