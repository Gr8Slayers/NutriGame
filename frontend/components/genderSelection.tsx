import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import styles from '../styles/SignUpEnterData';

const GenderSelector = ({ value, onChange }:{ value: 'male' | 'female' | null; onChange: (val: 'male' | 'female') => void; }) => {
      const [selectedGender, setGender] = useState<'male' | 'female' | null>(value);

    useEffect(() => {
        setGender(value);
    },[value]);

    const handleSelect = (gender: 'male'|'female') => {
        setGender(gender);
        onChange(gender);
    }

    return (
        <View style = {styles.inputContainer}>
            <Text style = {styles.label}>Gender *</Text>

            <View style = {styles.options}>
                <TouchableOpacity
                    style = {styles.option}
                    onPress={() => handleSelect('male')}
                    >
                    <View style = {[styles.circle, selectedGender === 'male' && styles.selected]} />
                    <Text style={styles.optionText }>Male</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style = {styles.option}
                    onPress={() => handleSelect('female')}
                    >
                    <View style = {[styles.circle, selectedGender === 'female' && styles.selected]} />
                    <Text style={styles.optionText }>Female</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};
export default GenderSelector;