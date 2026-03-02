import { StyleSheet, Platform, StatusBar, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#2b2118',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 16,
        backgroundColor: '#ABC270',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.5,
        shadowRadius: 5,
        elevation: 10,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    shareButton: {
        backgroundColor: '#5a8a3c',
        paddingHorizontal: 16,
        paddingVertical: 7,
        borderRadius: 20,
        minWidth: 64,
        alignItems: 'center',
    },
    shareButtonDisabled: {
        backgroundColor: '#3d4a2e',
        opacity: 0.6,
    },
    shareButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },

    scroll: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 48,
        gap: 20,
    },

    imagePicker: {
        width: '100%',
        height: 200,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#4d3826',
        borderStyle: 'dashed',
    },
    pickedImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    imageOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        gap: 8,
    },
    imageOverlayText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    imagePlaceholder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: '#3a2b1e',
    },
    imagePlaceholderText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#8a7060',
    },
    imagePlaceholderSub: {
        fontSize: 11,
        color: '#5a4a3a',
    },

    fieldGroup: {
        gap: 6,
    },
    fieldLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#c8a96e',
        letterSpacing: 0.3,
    },
    fieldHint: {
        fontSize: 11,
        color: '#6b5440',
        marginTop: -2,
    },
    required: {
        color: '#e55353',
    },
    input: {
        backgroundColor: '#3a2b1e',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 14,
        color: '#f0d9b0',
        borderWidth: 1,
        borderColor: '#4d3826',
    },
    inputMultiline: {
        paddingTop: 12,
        textAlignVertical: 'top',
    },
    inputTall: {
        minHeight: 110,
    },

    rowGroup: {
        flexDirection: 'row',
        gap: 12,
    },
    inputWithUnit: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    unitLabel: {
        fontSize: 13,
        color: '#8a7060',
        fontWeight: '600',
    },

    sectionDivider: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderTopWidth: 1,
        borderTopColor: '#3d2e20',
        paddingTop: 16,
    },
    sectionDividerText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#c8a96e',
    },

    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: '#7a4f28',
        borderRadius: 14,
        paddingVertical: 14,
        marginTop: 8,
        borderWidth: 1,
        borderColor: '#c8a96e44',
    },
    submitButtonDisabled: {
        opacity: 0.4,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
});
