import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import styles from '../styles/SignUpEnterData';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../i18n/LanguageContext';

const getGoals = (t: any) => [
  { label: t('goal_weight_loss') || 'Weight Loss', icon: 'flame-outline', value: 'Weight Loss' },
  { label: t('goal_muscle_mass') || 'Increasing Muscle Mass', icon: 'barbell-outline', value: 'Increasing Muscle Mass' },
  { label: t('goal_maintain') || 'Maintain Weight', icon: 'scale-outline', value: 'Maintain Weight' },
  { label: t('goal_fit') || 'Be Fit', icon: 'body-outline', value: 'Be Fit' },
  { label: t('goal_healthy') || 'Healthy Life', icon: 'leaf-outline', value: 'Healthy Life' },
];

interface GoalDropdownProps {
  value: string;
  onChange: (val: string) => void;
  buttonStyle?: any;
  buttonTextStyle?: any;
  labelStyle?: any;
  containerStyle?: any;
}

const GoalDropdown = ({ value, onChange, buttonStyle, buttonTextStyle, labelStyle, containerStyle }: GoalDropdownProps) => {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);
  const GOALS = getGoals(t);

  return (
    <View style={[styles.inputContainer, containerStyle]}>
      <Text style={[styles.label, labelStyle]}>{t('edit_profile_goal') || 'Goal *'}</Text>
      <TouchableOpacity
        style={[styles.goalButton, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, buttonStyle]}
        onPress={() => setVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.goalButtonText, buttonTextStyle]}>{
          GOALS.find(g => g.value === value)?.label || t('choose_goal') || 'Choose Your Goal'
        }</Text>
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        <TouchableOpacity
          style={modal.overlay}
          activeOpacity={1}
          onPress={() => setVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} style={modal.sheet}>

            <Text style={modal.title}>{t('choose_goal') || 'Choose Your Goal'}</Text>

            {GOALS.map((goal, index) => {
              const isSelected = value === goal.value;
              const isLast = index === GOALS.length - 1;
              return (
                <TouchableOpacity
                  key={goal.value}
                  activeOpacity={0.75}
                  onPress={() => { onChange(goal.value); setVisible(false); }}
                  style={[
                    modal.item,
                    isSelected && modal.itemSelected,
                    isLast && { borderBottomWidth: 0 },
                  ]}
                >
                  <View style={[modal.iconBox, isSelected && modal.iconBoxSelected]}>
                    <Ionicons
                      name={goal.icon as any}
                      size={20}
                      color={isSelected ? '#473C33' : '#8a7060'}
                    />
                  </View>
                  <Text style={[modal.itemText, isSelected && modal.itemTextSelected]}>
                    {goal.label}
                  </Text>
                  {isSelected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={22}
                      color="#473C33"
                      style={{ marginLeft: 'auto' }}
                    />
                  )}
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity style={modal.cancelButton} onPress={() => setVisible(false)}>
              <Text style={modal.cancelText}>{t('cancel') || 'Cancel'}</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const modal = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#f7e5c5',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
    paddingTop: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 16,
  },

  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#473C33',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd0b8',
    gap: 12,
  },
  itemSelected: {
    backgroundColor: '#FEC868',
    borderRadius: 12,
    borderBottomWidth: 0,
    marginVertical: 2,
    paddingHorizontal: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#ede0cc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxSelected: {
    backgroundColor: '#f7c94b',
  },
  itemText: {
    fontSize: 15,
    color: '#5a4a3a',
    fontWeight: '500',
  },
  itemTextSelected: {
    color: '#2e1f0e',
    fontWeight: '700',
  },
  cancelButton: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#e8d5b7',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8a6a4a',
  },
});

export default React.memo(GoalDropdown);
