import React, { useState } from 'react';
import { View } from 'react-native';
import { Menu, Button, Text } from 'react-native-paper';
import styles from '../styles/SignUpEnterData';

const GoalDropdown = ({ value, onChange }: { value: string; onChange: (val: string) => void }) => {
  const [visible, setVisible] = useState(false);

const openMenu = React.useCallback(() => setVisible(true), []);
const closeMenu = React.useCallback(() => setVisible(false), []);


  return (
    
    <View style={styles.inputContainer}>
      <Text style={styles.label}>Goal *</Text>
      <Menu
        visible={visible}
        onDismiss={closeMenu}
        anchorPosition="bottom"
        anchor={
          <Button
            mode="outlined"
            onPress={openMenu}
            style={styles.goalButton}>
            <Text style={styles.goalButtonText}>{value || 'Choose Your Goal'}</Text>
          </Button>
        }>
        <Menu.Item onPress={() => { onChange('Weight Loss'); closeMenu(); }} title="Weight Loss" />
        <Menu.Item onPress={() => { onChange('Increasing Muscle Mass'); closeMenu(); }} title="Increasing Muscle Mass" />
        <Menu.Item onPress={() => { onChange('Maintain Weight'); closeMenu(); }} title="Maintain Weight" />
        <Menu.Item onPress={() => { onChange('Be Fit'); closeMenu(); }} title="Be Fit" />
        <Menu.Item onPress={() => { onChange('Healthy Life'); closeMenu(); }} title="Healthy Life" />
      </Menu>
    </View>
  );
};

export default React.memo(GoalDropdown);
