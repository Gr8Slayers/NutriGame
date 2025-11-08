import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import styles from '../styles/SignUpEnterData';

const GenderSelector = ({ value, onChange }: { value: string; onChange: (val: string) => void }) => {
    const [selectedGender, setGender] = useState<'male' | 'female' | null>(null);
    return (
        <View style = {styles.inputContainer}>
            <Text style = {styles.label}>Gender *</Text>

            <View style = {styles.options}>
                <TouchableOpacity
                    style = {styles.option}
                    onPress={() => setGender('male')}
                    >
                    <View style = {[styles.circle, selectedGender === 'male' && styles.selected]} />
                    <Text style={styles.optionText }>Male</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style = {styles.option}
                    onPress={() => setGender('female')}
                    >
                    <View style = {[styles.circle, selectedGender === 'female' && styles.selected]} />
                    <Text style={styles.optionText }>Female</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};
export default GenderSelector;