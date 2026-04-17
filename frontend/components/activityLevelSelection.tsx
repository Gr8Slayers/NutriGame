import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import styles from '../styles/SignUpEnterData';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../i18n/LanguageContext';

const getActivityLevels = (t: any) => [
    { label: t('activity_sedentary') || 'Sedentary', description: t('activity_sedentary_desc') || 'Little or no exercise', icon: 'bed-outline', value: 'Sedentary' },
    { label: t('activity_light') || 'Lightly Active', description: t('activity_light_desc') || '1–3 days/week', icon: 'walk-outline', value: 'Lightly Active' },
    { label: t('activity_moderate') || 'Moderately Active', description: t('activity_moderate_desc') || '3–5 days/week', icon: 'bicycle-outline', value: 'Moderately Active' },
    { label: t('activity_very') || 'Very Active', description: t('activity_very_desc') || '6–7 days/week', icon: 'barbell-outline', value: 'Very Active' },
    { label: t('activity_extra') || 'Extra Active', description: t('activity_extra_desc') || 'Intense daily exercise or physical job', icon: 'flash-outline', value: 'Extra Active' },
];

interface ActivityDropdownProps {
    value: string;
    onChange: (val: string) => void;
    buttonStyle?: any;
    buttonTextStyle?: any;
    labelStyle?: any;
    containerStyle?: any;
}

const ActivityLevelDropdown = ({
    value,
    onChange,
    buttonStyle,
    buttonTextStyle,
    labelStyle,
    containerStyle,
}: ActivityDropdownProps) => {
    const { t } = useLanguage();
    const [visible, setVisible] = useState(false);
    const ACTIVITY_LEVELS = getActivityLevels(t);

    return (
        <View style={[styles.inputContainer, containerStyle]}>
            <Text style={[styles.label, labelStyle]}>{t('activity_level') || 'Activity Level *'}</Text>
            <TouchableOpacity
                style={[styles.goalButton, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, buttonStyle]}
                onPress={() => setVisible(true)}
                activeOpacity={0.7}
            >
                <Text style={[styles.goalButtonText, buttonTextStyle]}>{
                    ACTIVITY_LEVELS.find(a => a.value === value)?.label || t('choose_activity') || 'Choose Your Activity Level'
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
                        <Text style={modal.title}>{t('how_active') || 'How Active Are You?'}</Text>

                        {ACTIVITY_LEVELS.map((item, index) => {
                            const isSelected = value === item.value;
                            const isLast = index === ACTIVITY_LEVELS.length - 1;
                            return (
                                <TouchableOpacity
                                    key={item.value}
                                    activeOpacity={0.75}
                                    onPress={() => { onChange(item.value); setVisible(false); }}
                                    style={[
                                        modal.item,
                                        isSelected && modal.itemSelected,
                                        isLast && { borderBottomWidth: 0 },
                                    ]}
                                >
                                    <View style={[modal.iconBox, isSelected && modal.iconBoxSelected]}>
                                        <Ionicons
                                            name={item.icon as any}
                                            size={20}
                                            color={isSelected ? '#473C33' : '#8a7060'}
                                        />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[modal.itemText, isSelected && modal.itemTextSelected]}>
                                            {item.label}
                                        </Text>
                                        <Text style={modal.itemDescription}>{item.description}</Text>
                                    </View>
                                    {isSelected && (
                                        <Ionicons
                                            name="checkmark-circle"
                                            size={22}
                                            color="#473C33"
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
    itemDescription: {
        fontSize: 12,
        color: '#8a7060',
        marginTop: 2,
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

export default React.memo(ActivityLevelDropdown);
