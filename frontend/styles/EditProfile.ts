import { StyleSheet } from 'react-native';

export default StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a1812',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 20,
        backgroundColor: '#14281d',
    },
    backButton: {
        marginRight: 15,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#f7e5c5',
    },
    scrollContent: {
        padding: 20,
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 30,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 15,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 3,
        borderColor: '#47dd7caf',
    },
    changeAvatarButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#47dd7caf',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#0a1812',
    },
    inputSection: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        color: '#f7e5c5',
        marginBottom: 8,
        fontWeight: '600',
    },
    input: {
        backgroundColor: '#14281d',
        borderRadius: 10,
        padding: 15,
        fontSize: 16,
        color: '#f7e5c5',
        borderWidth: 1,
        borderColor: '#2a3f32',
    },
    inputDisabled: {
        backgroundColor: '#0f1f16',
        color: '#8a8a8a',
    },
    rowInputs: {
        flexDirection: 'row',
        gap: 15,
    },
    halfInput: {
        flex: 1,
    },
    saveButton: {
        backgroundColor: '#47dd7caf',
        borderRadius: 10,
        padding: 16,
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 40,
    },
    saveButtonText: {
        color: '#0a1812',
        fontSize: 16,
        fontWeight: 'bold',
    },
    // Avatar Selection Modal
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#14281d',
        borderRadius: 20,
        padding: 20,
        width: '90%',
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#f7e5c5',
    },
    closeButton: {
        padding: 5,
    },
    avatarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    avatarOption: {
        width: '23%',
        aspectRatio: 1,
        marginBottom: 10,
        borderRadius: 10,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    avatarOptionSelected: {
        borderColor: '#47dd7caf',
        borderWidth: 3,
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
});
