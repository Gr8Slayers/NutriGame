import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import styles from '../styles/SignUpEnterData';
import { Ionicons } from '@expo/vector-icons';

const ACTIVITY_LEVELS = [
    { label: 'Sedentary', description: 'Little or no exercise', icon: 'bed-outline' },
    { label: 'Lightly Active', description: '1–3 days/week', icon: 'walk-outline' },
    { label: 'Moderately Active', description: '3–5 days/week', icon: 'bicycle-outline' },
    { label: 'Very Active', description: '6–7 days/week', icon: 'barbell-outline' },
    { label: 'Extra Active', description: 'Intense daily exercise or physical job', icon: 'flash-outline' },
];

const ActivityLevelDropdown = ({
    value,
    onChange,
}: {
    value: string;
    onChange: (val: string) => void;
}) => {
    const [visible, setVisible] = useState(false);

    return (
        <View style={styles.inputContainer}>
            <Text style={styles.label}>Activity Level *</Text>
            <TouchableOpacity
                style={[styles.goalButton, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
                onPress={() => setVisible(true)}
                activeOpacity={0.7}
            >
                <Text style={styles.goalButtonText}>{value || 'Choose Your Activity Level'}</Text>
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
                        <Text style={modal.title}>How Active Are You?</Text>

                        {ACTIVITY_LEVELS.map((item, index) => {
                            const isSelected = value === item.label;
                            const isLast = index === ACTIVITY_LEVELS.length - 1;
                            return (
                                <TouchableOpacity
                                    key={item.label}
                                    activeOpacity={0.75}
                                    onPress={() => { onChange(item.label); setVisible(false); }}
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
                            <Text style={modal.cancelText}>Cancel</Text>
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
