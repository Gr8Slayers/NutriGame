import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BadgeImages } from '../constants/BadgeImages';

const { width, height } = Dimensions.get('window');

interface BadgeAwardModalProps {
  isVisible: boolean;
  onClose: () => void;
  badge: {
    name: string;
    description: string;
    iconName: string;
  } | null;
}

const BadgeAwardModal: React.FC<BadgeAwardModalProps> = ({ isVisible, onClose, badge }) => {
  if (!badge) return null;

  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.blurContainer}>
          <Animated.View style={styles.modalContent}>
            {/* Close Button */}
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Badge Icon with Glow effect */}
            <View style={styles.iconWrapper}>
              <View style={styles.ring1} />
              <View style={styles.ring2} />
              <View style={styles.ring3} />
              <Image
                source={BadgeImages[badge.iconName] || BadgeImages['water_1']}
                style={styles.badgeImage}
                resizeMode="contain"
              />
            </View>

            {/* Label */}
            <View style={styles.pillLabel}>
              <Text style={styles.pillText}>NEW BADGE EARNED!</Text>
            </View>

            {/* Content */}
            <Text style={styles.badgeName}>{badge.name}</Text>
            <Text style={styles.badgeDescription}>
              {badge.description}
            </Text>

            {/* Action Button */}
            <TouchableOpacity style={styles.actionButton} onPress={onClose}>
              <Text style={styles.actionButtonText}>Great, keep it up!</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  blurContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.85,
    backgroundColor: '#242919ff',
    borderRadius: 30,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  iconWrapper: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  ring1: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 2,
    borderColor: 'rgba(92, 107, 192, 0.3)',
  },
  ring2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 4,
    borderColor: 'rgba(92, 107, 192, 0.5)',
  },
  ring3: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(92, 107, 192, 0.2)',
  },
  badgeImage: {
    width: 100,
    height: 100,
  },
  pillLabel: {
    backgroundColor: '#D1D5F9', // Light lavender
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20,
  },
  pillText: {
    color: '#4B5563',
    fontSize: 12,
    fontWeight: '900',
  },
  badgeName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  badgeDescription: {
    color: '#9CA3AF',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  actionButton: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default BadgeAwardModal;
