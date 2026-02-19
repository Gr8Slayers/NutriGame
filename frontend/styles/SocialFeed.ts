import { StyleSheet, Platform, StatusBar, Dimensions } from 'react-native';

const { height, width } = Dimensions.get('window');

export default StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#473C33',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
});